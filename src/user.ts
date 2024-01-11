// @ts-nocheck

import axios from 'axios'
import { axiosOptions, removeAttributeKeycloak } from './utils.js'
import type KeycloakAdminClient from '@keycloak/keycloak-admin-client'
import type UserRepresentation from '@keycloak/keycloak-admin-client/lib/defs/userRepresentation'
import { createUserAPI } from './apim.js'

export const keycloakToken = process.env.KEYCLOAK_ADMIN_PASSWORD
export const keycloakUser = process.env.KEYCLOAK_ADMIN

export const getUserById = async (kcClient: KeycloakAdminClient, id: string): Promise<UserRepresentation> => {
  return await kcClient.users.findOne({ id })
}

export const createUser = async (user, kcClient: KeycloakAdminClient, kcUser: UserRepresentation) => {
  try {
    user.username = createUsername(user.email)
    // eslint-disable-next-line dot-notation
    const graviteeId = kcUser?.attributes['gravitee']
    const existingUser = await getUser(graviteeId)
    if (existingUser.id !== -1) {
      console.log(`User already exist in apim, continue ...`)
      return existingUser
    } else throw new Error()
  } catch {
    const newUser = await createUserAPI(user, kcUser, kcClient)
    // const keyAttribute = 'gravitee_id'.toString()
    // await addAttributeKeycloak(kcUser, kcClient, { [keyAttribute]: [newUser.id] })
    console.log(`Create user in gravitee with username: ${user.username}`)
    return newUser
  }
}

export const createUsername = (email: string) => email.replace('@', '.')

export const getUser = async (id: string) => {
  const user = await axios({
    ...axiosOptions,
    url: `/management/organizations/DEFAULT/environments/DEFAULT/users/${id}`,
    method: 'get',
  })
  return user.data
}

export const deleteUser = async (userId: string, kcClient: KeycloakAdminClient) => {
  await axios({
    ...axiosOptions,
    url: `/management/organizations/DEFAULT/users/${userId}`,
    method: 'delete',
  })
  const kcUser = await getUserById(kcClient, userId)
  await removeAttributeKeycloak(kcUser, kcClient, 'gravitee_id')
}

export const getUserByEmail = async (kcClient: KeycloakAdminClient, email: string) => {
  return (await kcClient.users.find({ email }))[0]
}
