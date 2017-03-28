// imports

const generator = require('yeoman-generator');
const chalk = require('chalk');
const packagejs = require('../../package.json'); // gives access to the package.json data
const dbh = require('./db-helper.js'); // db-helper utility functions


// Stores JHipster variables
const jhipsterVar = {
    moduleName: 'db-helper'
};

// Stores JHipster functions
const jhipsterFunc = {};


module.exports = generator.extend({

    // check current project state, get configs, etc
    initializing: {
        compose() {
            // DEBUG : log where we are
            dbh.debugLog('initializing: compose');

            this.composeWith('jhipster:modules',
                { jhipsterVar, jhipsterFunc },
                this.options.testmode ? { local: require.resolve('generator-jhipster/generators/modules') } : null
            );
        },
        displayLogo() {
            // Have Yeoman greet the user.
            this.log(`${chalk.bold.yellow('JHipster db-helper')} generator ${chalk.yellow(`v${packagejs.version}\n`)}`);
        }
    },

    // prompt the user for options
    prompting() {
        // DEBUG : log where we are
        dbh.debugLog('prompting');

        // commented out for the moment, we do not prompt anything (yet)
        /*
        const done = this.async();

        // user interaction on module call goes here
        const prompts = [
            {
                type: 'input',
                name: 'message',
                message: 'Please put something',
                default: 'hello world!'
            }
        ];

        // call the prompts
        this.prompt(prompts).then((props) => {
            this.props = props;
            // To access props later use this.props.someOption;

            done();
        });
        */
    },

    // other Yeoman run steps would go here :
    // configuring() {}
    // default() {}

    // write the generator-specific files
    writing() {
        // DEBUG : log where we are
        dbh.debugLog('writing');

        // replace files with Spring's naming strategies
        this.log('db-helper replaces your naming strategies.');
        dbh.replaceNamingStrategies();

        // function to use directly template
        this.template = function (source, destination) {
            this.fs.copyTpl(
                this.templatePath(source),
                this.destinationPath(destination),
                this
            );
        };

        this.baseName = jhipsterVar.baseName;
        this.packageName = jhipsterVar.packageName;
        this.angularAppName = jhipsterVar.angularAppName;
        this.clientFramework = jhipsterVar.clientFramework;
        this.clientPackageManager = jhipsterVar.clientPackageManager;
        const javaDir = jhipsterVar.javaDir;
        const resourceDir = jhipsterVar.resourceDir;
        const webappDir = jhipsterVar.webappDir;

        this.message = this.props.message;

        this.log('\n--- some config read from config ---');
        this.log(`baseName=${this.baseName}`);
        this.log(`packageName=${this.packageName}`);
        this.log(`angularAppName=${this.angularAppName}`);
        this.log(`clientFramework=${this.clientFramework}`);
        this.log(`clientPackageManager=${this.clientPackageManager}`);
        this.log(`javaDir=${javaDir}`);
        this.log(`resourceDir=${resourceDir}`);
        this.log(`webappDir=${webappDir}`);
        this.log(`\nmessage=${this.message}`);
        this.log('------\n');

        this.template('dummy.txt', 'dummy.txt');
        try {
            jhipsterFunc.registerModule('generator-jhipster-db-helper', 'app', 'post', 'app', 'A JHipster module for already existing databases');
        } catch (err) {
            this.log(`${chalk.red.bold('WARN!')} Could not register as a jhipster entity post creation hook...\n`);
        }
    },

    // run installation (npm, bower, etc)
    install() {
        let logMsg =
            `To install your dependencies manually, run: ${chalk.yellow.bold(`${this.clientPackageManager} install`)}`;

        // DEBUG : log where we are
        dbh.debugLog('install');

        if (this.clientFramework === 'angular1') {
            logMsg =
                `To install your dependencies manually, run: ${chalk.yellow.bold(`${this.clientPackageManager} install & bower install`)}`;
        }
        const injectDependenciesAndConstants = (err) => {
            if (err) {
                this.warning('Install of dependencies failed!');
                this.log(logMsg);
            } else if (this.clientFramework === 'angular1') {
                this.spawnCommand('gulp', ['install']);
            }
        };
        const installConfig = {
            bower: this.clientFramework === 'angular1',
            npm: this.clientPackageManager !== 'yarn',
            yarn: this.clientPackageManager === 'yarn',
            callback: injectDependenciesAndConstants
        };
        this.installDependencies(installConfig);
    },

    // cleanup, say goodbye
    end() {
        // DEBUG : log where we are
        dbh.debugLog('end');

        this.log('End of db-helper generator');
    }
});
