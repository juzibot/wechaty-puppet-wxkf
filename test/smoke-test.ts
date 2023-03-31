import { PuppetWxkf } from '../src/puppet-wxkf'

const puppet = new PuppetWxkf()

puppet.on('error', (e) => {
  console.log((e as Error).message)
})

puppet.start()