// @ts-nocheck

import type { RegisterFn } from '@dso-console/server/src/plugins/index.js'
import infos from './infos.js'
import { archiveDsoProject, createDsoProject, getDsoProjectSecrets } from './index.js'
export const init = (register: RegisterFn) => {
  register(
    infos.name,
    {
      createProject: {
        main: createDsoProject,
      },
      archiveProject: { main: archiveDsoProject },
      getProjectSecrets: { main: getDsoProjectSecrets },
    },
  )
}
