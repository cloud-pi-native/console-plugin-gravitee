import { type Plugin } from '@cpn-console/hooks'
import { createProject, archiveProject, getProjectSecrets } from './functions.js'
import infos from './infos.js'
import monitor from './monitor.js'

export const plugin: Plugin = {
  infos,
  subscribedHooks: {
    createProject: { steps: { main: createProject } },
    archiveProject: { steps: { main: archiveProject } },
    getProjectSecrets: { steps: { main: getProjectSecrets } },
  },
  monitor,
}
