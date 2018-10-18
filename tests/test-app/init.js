const readline = require('readline');
const { exec } = require('child_process');
const fs = require('fs');

// Disclaimer: I'm aware of the callback hell. But this is just a PoC done very quickly
// and didn't research further into promises with exec package.

// Terminal colors for later use
// TODO @dmerrill6: Package this into its own npm library.
const Reset = '\x1b[0m';
const Bright = '\x1b[1m';
const Dim = '\x1b[2m';
const Underscore = '\x1b[4m';
const Blink = '\x1b[5m';
const Reverse = '\x1b[7m';
const Hidden = '\x1b[8m';

const FgBlack = '\x1b[30m';
const FgRed = '\x1b[31m';
const FgGreen = '\x1b[32m';
const FgYellow = '\x1b[33m';
const FgBlue = '\x1b[34m';
const FgMagenta = '\x1b[35m';
const FgCyan = '\x1b[36m';
const FgWhite = '\x1b[37m';

const BgBlack = '\x1b[40m';
const BgRed = '\x1b[41m';
const BgGreen = '\x1b[42m';
const BgYellow = '\x1b[43m';
const BgBlue = '\x1b[44m';
const BgMagenta = '\x1b[45m';
const BgCyan = '\x1b[46m';
const BgWhite = '\x1b[47m';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const hexFace = '| ⌃⎽⎽⌃ | ';
const hexWink = '| ⌃⎽⎽- | ';
const hexChillFace = '| ⌒ .⌒ | ';
const hexQuestionFace = '| ⌃⎽⎽⌃ |? ';
const hexSadFace = '| ◡⎽⎽◡ | ';
const hexAnguishFace = '| ○⎽⎽○ | ';

const args = process.argv.slice(2);

const createDatabases = (databaseName, callback = () => {}) => {
  // =================================================================================
  // CREATING DATABASE IN POSTGRES
  // =================================================================================

  console.log(
    Reset,
    hexFace,
    'Creating local development & testing databases...',
  );
  exec(
    `createdb ${databaseName}_dev && createdb ${databaseName}_test`,
    (err, stdout, stdeer) => {
      if (err) {
        console.log(
          Reset,
          hexSadFace,
          FgYellow,
          "Databases couldn't be created.\r\nCheck that they don't exist already and that you are connected to your local postgres.\r\n",
          FgRed,
          `Error: ${stdeer}`,
          Reset,
        );
      }

      callback();
    },
  );
};

const createConfigFiles = (callback = () => {}) => {
  console.log(
    Reset,
    hexQuestionFace,
    'First thing I need to know.',
    FgGreen,
    "What's the name of your micro-service?\r\n",
    Reset,
    "This is going to be used for the Kubernetes Pod's name.\r\n",
    'Please make sure to pick a distinguishable name.\r\n',
    'Only use',
    FgCyan,
    'downcase-names-separated-by-dashes.',
    FgGreen,
  );

  rl.question(`micro-service name> ${Reset}`, (microServiceName) => {
    console.log(
      Reset,
      '\r\n\r\n',
      hexQuestionFace,
      FgGreen,
      `${microServiceName}${Reset}?`,
      "That's a cool name.",
      FgCyan,
      'Now, I need to know the database name for that service.',
      Reset,
      "Don't worry about differentiating between dev/test, I'll take care of that.\r\n",
      FgCyan,
      'It must be an_underscore_separated_name',
      FgGreen,
    );

    rl.question(`database name> ${Reset}`, (databaseName) => {
      console.log(
        '\r\n\r\n',
        Reset,
        hexFace,
        FgGreen,
        `${databaseName}${Reset} huh?`,
        "No problem. I'll set it up everything right now ✌.",
      );

      console.log(
        Reset,
        hexFace,
        'Creating knexfile.js with given database name...',
      );

      // =================================================================================
      // CREATE KNEX CONFIG FILE
      // =================================================================================

      exec(
        `sed -i.bu 's/<database_name_dev>/${databaseName}_dev/g; s/<database_name_test>/${databaseName}_test/g' ${__dirname}/knexfile-template.js && mv ${__dirname}/knexfile-template.js ${__dirname}/knexfile.js && mv ${__dirname}/knexfile-template.js.bu ${__dirname}/knexfile-template.js`,
        (err, stdout, stdeer) => {
          if (err) {
            console.log(
              Reset,
              hexSadFace,
              `File created with errors: ${FgRed}${stdeer}${Reset}`,
            );
          } else {
            console.log(Reset, hexFace, 'File created successfully.');
          }

          console.log(Reset, hexFace, 'Creating kubernetes config files...');

          // =================================================================================
          // CREATE KUBERNETES CONFIG FILES
          // =================================================================================

          exec(
            `sed -i.bu 's/<database_name_production>/${databaseName}_production/g; s/<postgres_pod_name>/${microServiceName}-postgres/g; s/<microservice_name>/${microServiceName}/g' ${__dirname}/kubernetes-templates/* && mv ${__dirname}/kubernetes-templates/*.yaml ${__dirname}/kubernetes/ && rename -v 's/\.bu//' ${__dirname}/kubernetes-templates/*.bu`,
            (err, stdout, stdeer) => {
              if (err) {
                console.log(
                  Reset,
                  hexSadFace,
                  `An error occurred: ${FgRed}${stdeer}${Reset}`,
                );
              } else {
                console.log(
                  Reset,
                  hexFace,
                  `Files created successfully at ${__dirname}/kubernetes folder.`,
                );
              }
              createDatabases(databaseName, () => {
                callback({ microServiceName, databaseName });
              });
            },
          );
        },
      );
    });
  });
};

const finishUp = (microServiceName) => {
  console.log(
    Reset,
    hexChillFace,
    FgGreen,
    'Process finished correctly! ✨\r\n\r\n',
    Reset,
  );

  if (microServiceName) {
    console.log(
      "Don't forget you still have to add this service to skaffold.yaml by adding:\r\n\r\n",
      `- imageName: ${microServiceName}\r\n`,
      `  workspace: ./services/${microServiceName}\r\n\r\n`,
      'to the artifacts array and:\r\n\r\n',
      `- ./services/${microServiceName}/kubernetes/*.yaml\r\n\r\n`,
      'to the manifests array.',
    );
  }

  // Delete gitignore as this has ejected from the boilerplate equilibrium.
  exec(`rm ${__dirname}/.gitignore`, (err, stdout, stdeer) => {
    if (err) console.log(stdeer);
    rl.close();
  });
};

const getDbName = () => {
  const knexConfig = require('./knexfile.js');
  const devDatabaseConn = knexConfig.development.connection;
  const devDbName = devDatabaseConn.split('/').pop();
  const dbName = devDbName
    .split('_')
    .slice(0, -1)
    .join('_');

  return dbName;
};

console.log(
  Reset,
  hexFace,
  FgCyan,
  "Hey! I'm Hex.",
  Reset,
  "I'll guide you through the process of creating your own micro-service.\r\n\r\n",
);

const alreadySetUp = fs.existsSync(`${__dirname}/knexfile.js`);

exec('command -v rename && command -v createdb', (err, stdout, stdeer) => {
  if (err) {
    console.log(
      Reset,
      hexSadFace,
      'Sorry...',
      FgRed,
      'This tool requires the `rename` and the `createdb` command to work.\r\n',
      Reset,
      'In OSX you can install `rename` with `brew install rename`. `createdb` is obtained by installing postgresql.',
    );
    throw 'Requirement unfulfilled';
  }

  if (args.includes('-k')) {
    const dbName = getDbName();
    createDatabases(dbName);
    rl.close();
  } else if (alreadySetUp) {
    const dbName = getDbName();
    console.log(
      Reset,
      hexQuestionFace,
      'Looks like config files have already been set up.\r\n',
      `It uses a database called ${FgCyan}${dbName}${Reset}.\r\n`,
      FgCyan,
      'Do you want to skip to database creation?.',
      Reset,
    );
    rl.question('(Y/n)>', (skipToDatabaseCreation) => {
      if (skipToDatabaseCreation.toLocaleLowerCase() !== 'n') {
        createDatabases(dbName, finishUp);
      } else {
        createConfigFiles(({ microServiceName }) => {
          finishUp(microServiceName);
        });
      }
    });
  } else {
    createConfigFiles(({ microServiceName }) => {
      finishUp(microServiceName);
    });
  }
});
