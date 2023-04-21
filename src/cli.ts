#!/usr/bin/env node
import yargs, { Arguments } from 'yargs'
import { hideBin } from 'yargs/helpers'
import { join } from 'path'
import { existsSync } from 'fs-extra'
import chalk from 'chalk'
import { CodeAnalysiserConfig } from './types'
import CodeAnalysiser from '.'
import ora from 'ora'

yargs(hideBin(process.argv))
  .command(
    'analysis',
    '分析项目代码健康度',
    () => {},
    async (arg: Arguments) => {
      console.log(chalk.bgBlue.white('开始读取配置文件'))
      const projectPath = process.cwd()
      const configFilePath = join(projectPath, 'analysis.config.js')
      console.log(configFilePath)
      if (!existsSync(configFilePath)) {
        console.log(chalk.red.bold('缺少配置文件：analysis.config.js'))
        return
      }
      console.log(chalk.green.bold('配置文件读取成功'))
      const config = (await import(projectPath)) as CodeAnalysiserConfig
      console.log(config)
      if (!config.extensions) {
        config.extensions = ['ts', 'tsx']
      }
      if (!config.entry) {
        chalk.red.bold('analysis.config.js缺少配置入口entry')
        return
      }
      const spinner = ora('开始扫描项目文件').start()
      try {
        const codeAnalysiser = new CodeAnalysiser(config)
        spinner.stop()
        console.log(chalk.green.bold('项目文件扫描完毕，开始生成扫描结果'))
        const score = codeAnalysiser.scoreResult.score
        console.log(chalk.red('代码得分：' + score))
        console.log(chalk.yellow('\n' + '代码优化建议：'))
        codeAnalysiser.scoreResult.messages.forEach((r, index) => {
          console.log(chalk.yellow(index + 1 + '. ' + r))
        })
      } catch (e: unknown) {
        spinner.stop()
        console.log(chalk.red((e as Error).stack))
      }
    }
  )
  .parse()
