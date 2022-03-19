/* eslint-disable import/no-named-as-default-member */
/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/explicit-function-return-type */

import ts from "typescript";
import { mkdtemp } from 'fs/promises';
import { join } from 'path';
import os from 'os';
import fs from 'fs-extra';
import Mocha from 'mocha';
import { promisify } from 'util';
import { exec } from 'child_process';

const formatHost = /** @type ts.FormatDiagnosticsHost */ ({
  getCanonicalFileName: (path) => path,
  getCurrentDirectory: ts.sys.getCurrentDirectory,
  getNewLine: () => ts.sys.newLine
});

/**
 * @param {ts.Diagnostic} diagnostic 
 */
function reportDiagnostic(diagnostic) {
  console.error("Error", diagnostic.code, ":", ts.flattenDiagnosticMessageText( diagnostic.messageText, formatHost.getNewLine()));
}

/**
 * Prints a diagnostic every time the watch status changes.
 * This is mainly for messages like "Starting compilation" or "Compilation completed".
 * @param {ts.Diagnostic} diagnostic 
 */
function reportWatchStatusChanged(diagnostic) {
  console.info(ts.formatDiagnostic(diagnostic, formatHost));
  if (diagnostic.code === 6194) {
    try {
      runMocha();
    } catch (e) {
      console.log(e);
    }
  }
}

/** @type string */
let tmp;
/** @type Mocha.Runner */
let mochaRunner;

async function runMocha() {
  if (mochaRunner) {
    mochaRunner.dispose();
    mochaRunner.abort();
    mochaRunner = undefined;
  }
  const mocha = new Mocha({
    color: true,
    lazyLoadFiles: true,
  });
  const testDir = join(tmp, 'test');
  fs.readdirSync(testDir).forEach(name => {
    const fullPath = join(testDir, name);
    const stat = fs.lstatSync(fullPath);
    if (stat.isDirectory()) {
      fs.readdirSync(fullPath).filter(file => file.endsWith('.node.test.js')).forEach(file => {
        const filePath = join(fullPath, file);
        console.log('Adding file', filePath);
        mocha.addFile(filePath);
      });
    }
  });
  await mocha.loadFilesAsync();
  mochaRunner = mocha.run(function(failures) {
    mocha.unloadFiles();
    console.log(`Test resulted with ${failures} failures`);
  });
}

async function watchMain() {
  tmp = await mkdtemp(join(os.tmpdir(), 'apic-core-'));
  await fs.copyFile('package.json', join(tmp, 'package.json'));
  console.info(`Created temporary directory: ${tmp}`);
  await promisify(exec)('npm install --ignore-scripts', {
    cwd: tmp,
  });
  const configPath = ts.findConfigFile(
    /*searchPath*/ "./",
    ts.sys.fileExists,
    "tsconfig-tests.json"
  );
  if (!configPath) {
    throw new Error("Could not find a valid 'tsconfig.json'.");
  }
  const host = ts.createWatchCompilerHost(
    configPath,
    {
      outDir: tmp,
    },
    ts.sys,
    ts.createSemanticDiagnosticsBuilderProgram,
    reportDiagnostic,
    reportWatchStatusChanged
  );
  ts.createWatchProgram(host);
}

function exitHandler(options={}) {
  if (options.cleanup && tmp) {
    fs.removeSync(tmp);
    tmp = undefined;
  }
  if (options.exit) {
    process.exit();
  }
}

watchMain();
process.on('exit', exitHandler.bind(null, { cleanup:true }));
process.on('SIGINT', exitHandler.bind(null, { exit:true }));
