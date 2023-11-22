// @ts-nocheck

import { StepCall } from '@dso-console/server/src/plugins/hooks/hook.js'
import { ArchiveProjectExecArgs, CreateProjectExecArgs, ProjectBase } from '@dso-console/server/src/plugins/hooks/project.js'
import { createUser, getUserById } from './user.js'
import { addUserToApp, createGraviteeApplication, deleteApplication, getDsoToken, subscribeToDsoApi } from './applications.js'
import KcAdminClient from '@keycloak/keycloak-admin-client'
import { keycloakDomain, keycloakProtocol, keycloakRealm } from './utils.js'

export const keycloakToken = process.env.KEYCLOAK_ADMIN_PASSWORD
export const keycloakUser = process.env.KEYCLOAK_ADMIN

export const getkcClient = async () => {
  const kcClient = new KcAdminClient({
    baseUrl: `${keycloakProtocol}://${keycloakDomain}`,
  })

  await kcClient.auth({
    clientId: 'admin-cli',
    grantType: 'password',
    username: keycloakUser,
    password: keycloakToken,
  })
  kcClient.setConfig({ realmName: keycloakRealm })
  return kcClient
}

export const createDsoProject: StepCall<CreateProjectExecArgs> = async (payload) => {
  try {
    const kcClient = await getkcClient()
    const { project, organization, owner } = payload.args
    const kcUser = await getUserById(kcClient, owner.id)
    const projectName = `${organization}-${project}`
    const apimUser = await createUser(owner, kcClient)
    const application = await createGraviteeApplication(owner, { name: projectName }, kcUser, kcClient)
    const addUser = await addUserToApp(apimUser.id, application.id)
    if (addUser !== true) {
      throw new Error(`Error while adding user ${apimUser.email} to app`)
    }
    const subscribtionToDso = await subscribeToDsoApi(application.id)
    if (subscribtionToDso.id !== -1) {
      const apiKey = await getDsoToken(application.id, subscribtionToDso.id)

      await payload.vault.write({
        API_KEY: apiKey,
        APPLICATION_ID: application.id,
        USER_ID: apimUser.id,
      }, 'APIM')
    }
    return {
      status: {
        result: 'OK',
        message: 'Created',
      },
      result: {
        application,
        apimUser,
      },
    }
  } catch (error) {
    return {
      status: {
        result: 'KO',
        message: error.message,
      },
      error: JSON.stringify(error),
    }
  }
}

export const archiveDsoProject: StepCall<ArchiveProjectExecArgs> = async (payload) => {
  try {
    const { project, organization, owner } = payload.args
    const kcClient = await getkcClient()
    const kcUser = await getUserById(kcClient, owner.id)
    const projectName = `${organization}-${project}`
    const applicationId = kcUser.attributes[projectName]
    console.log(applicationId)
    await deleteApplication(applicationId, projectName, kcUser, kcClient)
    return {
      status: {
        result: 'OK',
        message: 'Deleted',
      },
    }
  } catch (error) {
    return {
      status: {
        result: 'KO',
        message: error.message,
      },
      error: JSON.stringify(error),
    }
  }
}

export const getDsoProjectSecrets: StepCall<ProjectBase> = async (payload) => {
  try {
    if (!payload.vault) throw Error('no Vault available')
    // TODO déplacer les secrets dans un dossier pour tout lister plutôt que de sélectionner dans le code
    const apim = (await payload.vault.read('APIM')).data
    const apiKey = apim.API_KEY
    return {
      status: {
        result: 'OK',
        message: 'secret retrieved',
      },
      secrets: {
        'API-KEY': apiKey,
      },
    }
  } catch (error) {
    return {
      status: {
        result: 'OK',
        message: 'No secrets found for this project',
      },
      error: JSON.stringify(error),
    }
  }
}
