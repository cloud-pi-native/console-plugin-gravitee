// @ts-nocheck

import axios from 'axios'
import { axiosOptions, apimPlanId, removeAttributeKeycloak, addAttributeKeycloak } from './utils.js'
import UserRepresentation from '@keycloak/keycloak-admin-client/lib/defs/userRepresentation.js'
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

export const createGraviteeApplication = async (project: string) => {
  const requestBody = {
    name: project,
    description: `DSO App for project ${project}`,
    settings: {
      app: {
        client_id: project,
      },
    },
  }
  const newApp = await axios({
    ...axiosOptions,
    method: 'post',
    url: '/management/organizations/DEFAULT/environments/DEFAULT/applications',
    data: requestBody,
  })
  console.log(`Create Application for project: ${project}`)
  return newApp.data
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
      paramsSerializer: function paramsSerializer(params) {
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
      return { id: -1 }
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
  await axios({
    ...axiosOptions,
    method: 'post',
    url: `/management/organizations/DEFAULT/environments/DEFAULT/applications/${idApp}/members`,
    data: requestBody,
  })
  return true
}

export const subscribeToDsoApi = async (idApp: string) => {
  const headers = { ...axiosOptions.headers, accept: 'application/json' }
  const suscribe = await axios({
    baseURL: axiosOptions.baseURL,
    url: `/management/organizations/DEFAULT/environments/DEFAULT/applications/${idApp}/subscriptions/?plan=${apimPlanId}`,
    method: 'post',
    headers,
    data: {},
  })
  return suscribe.data
}

export const getDsoToken = async (applicationId: string, subscriptionId: string) => {
  const appKeys = await axios({
    ...axiosOptions,
    url: `/management/organizations/DEFAULT/environments/DEFAULT/applications/${applicationId}/subscriptions/${subscriptionId}/apikeys`,
    method: 'get',
  })
  const appKey = appKeys.data[0].key
  if (appKey) {
    return appKey
  } else {
    console.log('API-KEY does\'t exist')
    throw new Error('Keys doesn\'t exist')
  }
}

export const deleteApplication = async (applicationId: string, applicationName: string, kcUser: UserRepresentation, kcClient: KeycloakAdminClient) => {
  await axios({
    ...axiosOptions,
    url: `/management/organizations/DEFAULT/environments/DEFAULT/applications/${applicationId}`,
    method: 'delete',
  })
  await removeAttributeKeycloak(kcUser, kcClient, applicationName)
}
