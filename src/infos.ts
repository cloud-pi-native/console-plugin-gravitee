// @ts-nocheck

import type { ServiceInfos } from '@dso-console/server/src/plugins/services.js'
import { apimUrl } from './utils'


const infos: ServiceInfos = {
  name: 'apim',
  to: () => `${apimUrl}`,
  title: 'Apim Gravitee',
  imgSrc: '/img/gitlab.svg',
  description: 'Apim est un service d\'apim.',
}

export default infos
