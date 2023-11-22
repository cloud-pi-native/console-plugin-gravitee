// @ts-nocheck

import axios from 'axios'
import { axiosOptions } from './utils'

export const createUserAPI = async (user) => {
  const requestBody = {
    firstname: user.firstName,
    lastname: user.lastName,
    email: user.email,
    source: 'keycloak',
    sourceId: user.id,
    service: false,
    primary_owner: true,

  }
  try {
    const newUser = await axios({
      ...axiosOptions,
      method: 'post',
      url: '/management/organizations/DEFAULT/environments/DEFAULT/users',
      data: requestBody,
    })
    return newUser.data
  } catch (e) {
    console.log('Create APIM USER error: ', e)
    throw new Error(e)
  }
}
