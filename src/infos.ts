import type { ServiceInfos } from '@dso-console/server/src/plugins/services.js'

const infos: ServiceInfos = {
  name: 'apim',
  to: () => 'https://console-dev.apps.c7.numerique-interieur.com',
  title: 'Apim Gravitee',
  imgSrc: '/img/gitlab.svg',
  description: 'Apim est un service d\'apim.',
}

export default infos
