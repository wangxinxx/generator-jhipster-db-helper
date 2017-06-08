const chalk = require('chalk');
const fs = require('fs');
const Generator = require('yeoman-generator');
const path = require('path');

const dbh = require('../dbh.js');
const DBH_CONSTANTS = require('../dbh-constants');
const packagejs = require('../../package.json'); // gives access to the package.json data

// Stores JHipster variables
const jhipsterVar = {
    moduleName: DBH_CONSTANTS.moduleName.postAppGenerator
};

// Stores JHipster functions
const jhipsterFunc = {};

Generator.prototype.log = (msg) => { console.log(msg); };

module.exports = class extends Generator {
    // TODO : refactor (no testing logic in production code)
    /**
     * Get the absolute path of the config file .yo-rc.json.
     * When used normally, this function returns the current application's .yo-rc.json.
     * When testing, this function returns the config file for the given test case, which is a constant.
     */
    _getConfigFilePath(testCase) {
        let filePath = null;

        if (typeof testCase !== 'string') {
            throw new TypeError(`_getConfigFilePath: testCase parameter: expected type 'string', was instead '${typeof testCase}'`);
        }

        // set filePath depending on whether the generator is running a test case or not
        if (testCase === '') {
            filePath = path.join(process.cwd(), '/.yo-rc.json');
        } else if (DBH_CONSTANTS.testCases[testCase] !== undefined) {
            filePath = path.join(__dirname, '..', DBH_CONSTANTS.testConfigFiles[testCase]);
        } else {
            throw new Error(`_getConfigFilePath: testCase parameter: not a test case we know of. testCase was: ${testCase}`);
        }

        if (!fs.existsSync(filePath)) {
            throw new Error(`_getConfigFilePath: Sought after this file, but it doesn't exist. Path was:\n${filePath}`);
        }

        return filePath;
    }

    // get jhipsterVar and jhipsterFunc properties
    // without worrying about discrepancies between testing, dev & production code
    _getDbhVar(testCase) {
        const configFile = this._getConfigFilePath(testCase);

        return dbh.postAppPolyfill(configFile)
        .then(
            (onFulfilled) => {
                const result = {};

                result.registerModule = onFulfilled.registerModule;

                result.buildTool = onFulfilled.buildTool;
                result.baseName = onFulfilled.baseName;
                result.packageName = onFulfilled.packageName;
                result.angularAppName = onFulfilled.angularAppName;
                result.clientFramework = onFulfilled.clientFramework;
                result.clientPackageManager = onFulfilled.clientPackageManager;

                return result;
            },
            (onRejected) => {
                throw new Error(onRejected);
            }
        );
    }

    /** Duplicate of a JHipster function where we have replaced how the path is handled, because we use absolute paths */
    _replaceContent (absolutePath, pattern, content, regex, generator) {
        const re = regex ? new RegExp(pattern, 'g') : pattern;
        let body = generator.fs.read(absolutePath);

        body = body.replace(re, content);
        generator.fs.write(absolutePath, body);
    }

    constructor(args, opts) {
        super(args, opts);
    }

    // check current project state, get configs, etc
    initializing() {
        // Have Yeoman greet the user.
        this.log(chalk.bold.green(`JHipster db-helper generator v${packagejs.version}`));

        // note : before this line we can't use jhipsterVar or jhipsterFunc
        this.composeWith('jhipster:modules',
            { jhipsterVar, jhipsterFunc },
            this.options.testmode ? { local: require.resolve('generator-jhipster/generators/modules') } : null
        );
    }

    // prompt the user for options
    prompting() {
        const done = this.async();

        // user interaction on module call goes here
        const prompts = [];

        // call the prompts
        this.prompt(prompts).then((props) => {
            this.props = props;
            // To access props later use this.props.someOption;
            done();
        });
    }

    // write the generator-specific files
    writing() {
        this.message = this.props.message;

        try {
            jhipsterFunc.registerModule('generator-jhipster-db-helper', 'app', 'post', 'app', 'A JHipster module for already existing databases');
        } catch (err) {
            this.log(`${chalk.red.bold('WARN!')} Could not register as a jhipster entity post creation hook...\n`);
        }

        try {
            jhipsterFunc.registerModule('generator-jhipster-db-helper', 'entity', 'post', 'fix-entity', 'A JHipster module to circumvent JHipster limitations about names');
        } catch (err) {
            this.log(`${chalk.red.bold('WARN!')} Could not register as a jhipster entity post creation hook...\n`);
        }

        // replace files with Spring's naming strategies
        this.log(chalk.bold.yellow('JHipster-db-helper replaces your naming strategies :'));
        dbh.replaceNamingStrategies(jhipsterVar.jhipsterConfig.buildTool);
    }

    // run installation (npm, bower, etc)
    install() {
        let logMsg = `To install your dependencies manually, run: ${chalk.yellow.bold(`${jhipsterVar.clientPackageManager} install`)}`;

        if (jhipsterVar.clientFramework === 'angular1') {
            logMsg = `To install your dependencies manually, run: ${chalk.yellow.bold(`${jhipsterVar.clientPackageManager} install & bower install`)}`;
        }

        const injectDependenciesAndConstants = (err) => {
            if (err) {
                this.log('Install of dependencies failed!');
                this.log(logMsg);
            } else if (jhipsterVar.clientFramework === 'angular1') {
                this.spawnCommand('gulp', ['install']);
            }
        };

        const installConfig = {
            bower: jhipsterVar.clientFramework === 'angular1',
            npm: jhipsterVar.clientPackageManager !== 'yarn',
            yarn: jhipsterVar.clientPackageManager === 'yarn',
            callback: injectDependenciesAndConstants
        };

        this.installDependencies(installConfig);
    }

    // cleanup, say goodbye
    end() {
        this.log(chalk.bold.yellow('End of db-helper generator'));
    }
};
