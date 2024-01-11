// @ts-nocheck

import axios from 'axios'
import { axiosOptions, addAttributeKeycloak } from './utils.js'
import UserRepresentation from '@keycloak/keycloak-admin-client/lib/defs/userRepresentation.js'
import KeycloakAdminClient from '@keycloak/keycloak-admin-client.js'

export const createUserAPI = async (user, kcUser: UserRepresentation, kcClient: KeycloakAdminClient) => {
  const requestBody = {
    firstname: user.firstName,
    lastname: user.lastName,
    email: user.email,
    source: 'memory',
    sourceId: user.id,
    service: false,
    primary_owner: true,

  }
  const newUser = await axios({
    ...axiosOptions,
    method: 'post',
    url: '/management/organizations/DEFAULT/environments/DEFAULT/users',
    data: requestBody,
  })
  await addAttributeKeycloak(kcUser, kcClient, 'gravitee', newUser.data.id)
  return newUser.data
}
