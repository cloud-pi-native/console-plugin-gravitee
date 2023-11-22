// @ts-nocheck

import type { RegisterFn } from '@dso-console/server/src/plugins'
import infos from './infos.js'
import { archiveDsoProject, createDsoProject, getDsoProjectSecrets } from './index.js'
export const init = (register: RegisterFn) => {
  register(
    infos.name,
    {
      createProject: {
        // @ts-ignore
        main: createDsoProject,
      },
      // @ts-ignore
      archiveProject: { main: archiveDsoProject },
      // @ts-ignore
      getProjectSecrets: { main: getDsoProjectSecrets },
    },
  )
}
