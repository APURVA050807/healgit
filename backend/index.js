const yargs = require("yargs/yargs");
const { hideBin } = require("yargs/helpers");
const { scanFile } = require("./controllers/scanController");
const { healFile } = require("./controllers/healController");
const { safeCommit } = require("./controllers/gitController");

yargs(hideBin(process.argv))
  .command(
    "scan <file>",
    "Deterministically scan a file for syntax bugs and hallucinated references",
    (yargs) => {
      return yargs.positional("file", {
        describe: "Path to the JavaScript file to scan",
        type: "string",
      });
    },
    async (argv) => {
      await scanFile(argv.file);
    }
  )
  .command(
    "heal <file>",
    "Autonomously fix and verify a broken file using the Neuro-Symbolic AI loop",
    (yargs) => {
      return yargs.positional("file", {
        describe: "Path to the JavaScript file to heal",
        type: "string",
      });
    },
    async (argv) => {
      await healFile(argv.file);
    }
  )
  .command(
    "commit <message>",
    "Scan and auto-heal all modified JS files, then commit clean code to Git",
    (yargs) => {
      return yargs.positional("message", {
        describe: "Git commit message",
        type: "string",
      });
    },
    async (argv) => {
      await safeCommit(argv.message);
    }
  )
  .demandCommand(1, "Please specify a command: scan, heal, or commit")
  .help().argv;