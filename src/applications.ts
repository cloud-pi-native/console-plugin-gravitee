// @ts-nocheck

import axios from 'axios'
import { axiosOptions, apimPlanId, removeAttributeKeycloak, addAttributeKeycloak } from './utils.js'
import UserRepresentation from '@keycloak/keycloak-admin-client/lib/defs/userRepresentation'
import KeycloakAdminClient from '@keycloak/keycloak-admin-client'

export const check = async () => {
  let health
  try {
    health = await axios({
      ...axiosOptions,
      url: 'health',
    })
    if (health.data.status !== 'healthy') {
      return {
        status: {
          result: 'KO',
          message: health.data.components,
        },
      }
    }
    return {
      status: {
        result: 'OK',
      },
    }
  } catch (error) {
    return {
      status: {
        result: 'KO',
        message: error.message,
      },
    }
  }
}

export const createGraviteeApplication = async (user: { email: string, username: string, id: string, firstname: string, lastname: string }, project: { name: string }, kcUser: UserRepresentation, kcClient: KeycloakAdminClient) => {
  const existingApp = await getGraviteeApp(project.name)
  const requestBody = {
    name: project.name,
    description: `DSO App for project ${project.name}`,
    settings: {
      app: {
        client_id: project.name,
      },
    },
  }
  if (existingApp.id !== -1) {
    // TODO EDIT APP
    console.log('application already exists, continue ...')
    return existingApp
  }
  try {
    const newApp = await axios({
      ...axiosOptions,
      method: 'post',
      url: '/management/organizations/DEFAULT/environments/DEFAULT/applications',
      data: requestBody,
    })
    console.log('kc_user_app', kcUser)
    await addAttributeKeycloak(kcUser, kcClient, project.name, newApp.data.id)
    // await addAttributeKeycloak(kcUser, kcClient, { [keyAttribute]: [newUser.id] })
    return newApp.data
  } catch (e) {
    console.log('Create APIM App error: ', e)
    return { id: -1 }
  }
}

export const getGraviteeApp = async (name: string) => {
  const params = {
    page: 1,
    size: 10,
    status: 'ACTIVE',
  }
  try {
    const appList = await axios({
      ...axiosOptions,
      url: '/management/organizations/DEFAULT/environments/DEFAULT/applications/_paged',
      method: 'get',
      params,
      paramsSerializer: function paramsSerializer (params) {
        // "Hide" the `answer` param
        return Object.entries(Object.assign({}, params, { answer: 'HIDDEN' }))
          .map(([key, value]) => `${key}=${value}`)
          .join('&')
      },
    })
    const appQuery = appList.data.find(elem => elem.name === name)
    if (appQuery) {
      return appQuery
    } else {
      throw new Error('App not exist')
    }
  } catch (e) {
    return { id: -1 }
  }
}

export const addUserToApp = async (idUser: string, idApp: string) => {
  const requestBody = {
    id: idUser,
    reference: '',
    role: 'USER',
  }
  try {
    await axios({
      ...axiosOptions,
      method: 'post',
      url: `/management/organizations/DEFAULT/environments/DEFAULT/applications/${idApp}/members`,
      data: requestBody,
    })
    return true
  } catch (e) {
    console.log('Add user to App error')
    return false
  }
}

export const subscribeToDsoApi = async (idApp: string) => {
  try {
    const headers = { ...axiosOptions.headers, accept: 'application/json' }
    const suscribe = await axios({
      baseURL: axiosOptions.baseURL,
      url: `/management/organizations/DEFAULT/environments/DEFAULT/applications/${idApp}/subscriptions/?plan=${apimPlanId}`,
      method: 'post',
      headers,
      data: {},
    })
    console.log('OK SUBSCRIBE')
    return suscribe.data
  } catch (e) {
    console.log('Suscribe already exist')
    console.log(e.message)
    return { id: -1 }
  }
}

export const getDsoToken = async (applicationId: string, subscriptionId: string) => {
  try {
    const appKeys = await axios({
      ...axiosOptions,
      url: `/management/organizations/DEFAULT/environments/DEFAULT/applications/${applicationId}/subscriptions/${subscriptionId}/apikeys`,
      method: 'get',
    })
    console.log('clé', appKeys.data)
    const appKey = appKeys.data[0].key

    if (appKey) {
      return appKey
    } else {
      throw new Error("Keys doesn't exist")
    }
  } catch (e) {
    return { key: -1 }
  }
}

export const deleteApplication = async (applicationId: string, applicationName: string, kcUser: UserRepresentation, kcClient: KeycloakAdminClient) => {
  try {
    await axios({
      ...axiosOptions,
      url: `/management/organizations/DEFAULT/environments/DEFAULT/applications/${applicationId}`,
      method: 'delete',
    })
    await removeAttributeKeycloak(kcUser, kcClient, applicationName)
  } catch (error) {
    console.log(error)
  }
}
