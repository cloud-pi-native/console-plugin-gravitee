import { type ServiceInfos } from '@cpn-console/hooks'
import { getConfig } from './utils.js'

const infos: ServiceInfos = {
  name: 'gravitee',
  to: () => getConfig().apimUrl,
  title: 'Gravitee',
  imgSrc: 'https://www.gravitee.io/hubfs/Gravitee_2022/Images/logo-dark.svg',
  description: 'Gravitee est un outil d\'API Management / API Gateway',
}

export default infos
