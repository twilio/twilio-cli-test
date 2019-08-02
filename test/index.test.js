const { expect, test } = require('../src');

class FakeConfig {
  constructor(configDir) {
    this.configDir = configDir;
  }

  save(configData) {
    expect(configData).to.not.be.null;
  }
}

class FakeConfigData {
  addProfile(profileId, accountSid) {
    this.profileId = profileId;
    this.accountSid = accountSid;
  }
}

class FakeCommand {
  constructor(args, config, secureStorage) {
    this.args = args;
    this.config = config;
    this.secureStorage = secureStorage;
    this.ran = false;
  }

  async run() {
    this.ran = true;
    return 0;
  }
}

describe('test', () => {
  test.it('should run a basic test', () => {
    expect(0).to.equal(0);
  });

  describe('twilioCliEnv', () => {
    test.twilioCliEnv(FakeConfig).it('should set up a mock CLI environment', ctx => {
      expect(ctx.config.configDir).to.equal(ctx.fakeConfig.configDir);
    });

    test
      .do(ctx => {
        ctx.config = {
          providedFakeConfig: true
        };
      })
      .twilioCliEnv(FakeConfig)
      .it('should set up a mock CLI environment, using provided config object', ctx => {
        expect(ctx.config.providedFakeConfig).to.be.true;
        expect(ctx.config.configDir).to.equal(ctx.fakeConfig.configDir);
      });
  });

  describe('twilioFakeProfile', () => {
    test
      .twilioFakeProfile(FakeConfigData)
      .twilioCliEnv(FakeConfig)
      .it('should add a mock default profile', ctx => {
        expect(ctx.userConfig.profileId).to.equal('default');
        expect(ctx.userConfig.accountSid).to.include('AC');
      });
  });

  describe('twilioCreateCommand', () => {
    test
      .twilioCliEnv(FakeConfig)
      .twilioCreateCommand(FakeCommand, [])
      .it('should create the command class', async ctx => {
        const creds = await ctx.testCmd.secureStorage.getCredentials('default');
        expect(creds.apiKey).to.contain('SK');
        expect(ctx.testCmd.ran).to.be.false;
      });
  });

  describe('twilioCommand', () => {
    test
      .twilioCliEnv(FakeConfig)
      .twilioCommand(FakeCommand, [])
      .it('should create the command class and run the command', async ctx => {
        const creds = await ctx.testCmd.secureStorage.getCredentials('default');
        expect(creds.apiKey).to.contain('SK');
        expect(ctx.testCmd.ran).to.be.true;
      });
  });
});
