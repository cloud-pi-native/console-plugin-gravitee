// @ts-nocheck

import type { ServiceInfos } from '@dso-console/server/src/plugins/services.js'
import { apimUrl } from './utils.js'


const infos: ServiceInfos = {
  name: 'apim',
  to: () => `${apimUrl}`,
  title: 'Apim Gravitee',
  imgSrc: 'https://www.gravitee.io/hubfs/Gravitee_2022/Images/logo-dark.svg',
  description: 'Apim est un service d\'apim.',
}

export default infos
