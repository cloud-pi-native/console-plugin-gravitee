import axios from 'axios'
import { addAttributeKeycloak, axiosOptions, removeAttributeKeycloak } from './utils'
import KeycloakAdminClient from '@keycloak/keycloak-admin-client'
import UserRepresentation from '@keycloak/keycloak-admin-client/lib/defs/userRepresentation'
import { createUserAPI } from './apim'

export const keycloakToken = process.env.KEYCLOAK_ADMIN_PASSWORD
export const keycloakUser = process.env.KEYCLOAK_ADMIN

export const getUserById = async (kcClient: KeycloakAdminClient, id: string):Promise<UserRepresentation> => {
  return (await kcClient.users.findOne({ id }))
}

export const createUser = async (user, kcClient: KeycloakAdminClient) => {
  user.username = createUsername(user.email)
  try {
    const kcUser = await getUserById(kcClient, user.id)
    console.log('kcUser:', kcUser)
    try {
      const graviteeId = kcUser.attributes.gravitee_id
      const existingUser = await getUser(graviteeId)
      console.log('graviteeId', graviteeId)
      console.log('existingUser', existingUser)
      if (existingUser.id !== -1) {
        console.log('existingUser', existingUser)
        console.log('user already exist continue ..')
        return existingUser
      }
    } catch (e) {
      console.log(`User ${user.username} not exist, creation will follow ...`)
    }
    try {
      const newUser = await createUserAPI(user)
      const keyAttribute = 'gravitee_id'
      console.log("add user attributes: ",  { [keyAttribute + "'"]: [newUser.id] })
      await addAttributeKeycloak(kcUser, kcClient, { ["'" + keyAttribute + "'"]: [newUser.id] })
      return newUser
    } catch (e) {
      console.log('Create APIM USER error: ', e)
    }
  } catch (e) {
    console.log('something went wrong')
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
    console.log(error)
  }
}

export const getUserByEmail = async (kcClient: KeycloakAdminClient, email: string) => {
  return (await kcClient.users.find({ email }))[0]
}
