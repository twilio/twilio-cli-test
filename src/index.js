const sinon = require('sinon');
const { Config: OclifConfig } = require('@oclif/core');
const { expect, test } = require('@oclif/test');
const tmp = require('tmp');

require('chai').use(require('chai-as-promised'));

function getFakeSid(prefix) {
  return (
    prefix
      .trim()
      .toUpperCase()
      .substr(0, 2) + '1234567890abcdef1234567890abcdef'
  );
}

const constants = {
  FAKE_ACCOUNT_SID: getFakeSid('AC'),
  FAKE_API_KEY: getFakeSid('SK'),
  FAKE_API_SECRET: 'fake password'
};

async function createCommand(ctx, CommandClass, args) {
  ctx.testCmd = new CommandClass(args, ctx.fakeConfig);
  if (ctx.testCmd.userConfig) {
    sinon.replace(ctx.testCmd.userConfig, 'getProfileById', profileId => {
      return {
        id: constants.FAKE_ACCOUNT_SID,
        apiKey: constants.FAKE_API_KEY,
        apiSecret: constants.FAKE_API_SECRET + profileId
      };
    });
  }
}

function clearEnvironmentVars() {
  Object.keys(process.env)
    .filter(k => k.match(/^(TWILIO|SENDGRID)_/))
    .forEach(k => delete process.env[k]);
}

/* eslint-disable require-atomic-updates */
const twilioTest = test
  .register('twilioCliEnv', Config => {
    return {
      async run(ctx) {
        ctx.tempConfigDir = tmp.dirSync({ unsafeCleanup: true });
        ctx.fakeConfig = {
          configDir: ctx.tempConfigDir.name
        };

        if (!ctx.config) {
          ctx.config = await OclifConfig.load();
        }
        ctx.config.configDir = ctx.fakeConfig.configDir;

        if (ctx.userConfig) {
          const tempConfig = new Config(ctx.fakeConfig.configDir);
          await tempConfig.save(ctx.userConfig);
        }
      },
      finally(ctx) {
        ctx.tempConfigDir.removeCallback();
      }
    };
  })
  .register('twilioFakeProfile', ConfigData => {
    return {
      run(ctx) {
        ctx.userConfig = new ConfigData();
        ctx.userConfig.addProfile('default', constants.FAKE_ACCOUNT_SID, undefined, constants.FAKE_API_KEY, `${constants.FAKE_API_SECRET}default`);
        ctx.userConfig.setActiveProfile('default');
      }
    };
  })
  .register('twilioCreateCommand', (CommandClass, args) => {
    return {
      async run(ctx) {
        await createCommand(ctx, CommandClass, args);
      }
    };
  })
  .register('twilioCommand', (CommandClass, args) => {
    return {
      async run(ctx) {
        await createCommand(ctx, CommandClass, args);
        await ctx.testCmd.run();
      }
    };
  })
  .do(clearEnvironmentVars);

module.exports = {
  expect,
  test: twilioTest,
  constants,
  getFakeSid
};
