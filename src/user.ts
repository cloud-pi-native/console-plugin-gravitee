// @ts-nocheck

import axios from 'axios'
import { axiosOptions, removeAttributeKeycloak } from './utils.js'
import type KeycloakAdminClient from '@keycloak/keycloak-admin-client'
import type UserRepresentation from '@keycloak/keycloak-admin-client/lib/defs/userRepresentation'
import { createUserAPI } from './apim.js'

export const keycloakToken = process.env.KEYCLOAK_ADMIN_PASSWORD
export const keycloakUser = process.env.KEYCLOAK_ADMIN

export const getUserById = async (kcClient: KeycloakAdminClient, id: string):Promise<UserRepresentation> => {
  return (await kcClient.users.findOne({ id }))
}

export const createUser = async (user, kcClient: KeycloakAdminClient, kcUser: UserRepresentation) => {
  user.username = createUsername(user.email)
  try {
    try {
      // eslint-disable-next-line dot-notation
      const graviteeId = kcUser.attributes['gravitee']
      const existingUser = await getUser(graviteeId)
      if (existingUser.id !== -1) {
        return existingUser
      }
    } catch (e) {
      console.log(`User ${user.username} not exist, creation will follow ...`)
    }
    try {
      const newUser = await createUserAPI(user, kcUser, kcClient)
      // const keyAttribute = 'gravitee_id'.toString()
      // await addAttributeKeycloak(kcUser, kcClient, { [keyAttribute]: [newUser.id] })
      return newUser
    } catch (e) {
      console.error('Create APIM USER error: ', e)
    }
  } catch (e) {
    console.error('something went wrong')
  }
}

export const createUsername = (email: string) => email.replace('@', '.')

export const getUser = async (id: string) => {
  try {
    const user = await axios({
      ...axiosOptions,
      url: `/management/organizations/DEFAULT/environments/DEFAULT/users/${id}`,
      method: 'get',
    })
    return user.data
  } catch (e) {
    return { email: '', username: '', id: -1 }
  }
}

export const deleteUser = async (userId: string, kcClient: KeycloakAdminClient) => {
  try {
    await axios({
      ...axiosOptions,
      url: `/management/organizations/DEFAULT/users/${userId}`,
      method: 'delete',
    })
    const kcUser = await getUserById(kcClient, userId)
    await removeAttributeKeycloak(kcUser, kcClient, 'gravitee_id')
  } catch (error) {
    console.error(error)
  }
}

export const getUserByEmail = async (kcClient: KeycloakAdminClient, email: string) => {
  return (await kcClient.users.find({ email }))[0]
}
