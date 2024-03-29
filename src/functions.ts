import type { ArchiveProjectExecArgs, CreateProjectExecArgs, GetProjectSecretsExecArgs, StepCall } from '@cpn-console/hooks'
import { createUser, getUserById } from './user.js'
import { addUserToApp, createGraviteeApplication, deleteApplication, getDsoToken, getGraviteeApp, subscribeToDsoApi } from './applications.js'
import { addAttributeKeycloak, getConfig, getkcClient } from './utils.js'

export const createProject: StepCall<CreateProjectExecArgs> = async (payload) => {
  try {
    const kcClient = await getkcClient()
    const { project, organization, owner } = payload.args

    console.log(`Initialize plugin APIM for project ${project}`)

    let kcUser = await getUserById(kcClient, owner.id)
    const projectName = `${organization}-${project}`
    const apimUser = await createUser(owner, kcClient, kcUser)
    kcUser = await getUserById(kcClient, owner.id) // refresh values, there is a best way to do it but don't have time
    const existingApp = await getGraviteeApp(project)
    if (!existingApp) {
      const application = await createGraviteeApplication(projectName)
      await addAttributeKeycloak(kcUser, kcClient, projectName, application.id)
      await addUserToApp(apimUser.id, application.id)
      const subscribtionToDso = await subscribeToDsoApi(application.id)
      const apiKey = await getDsoToken(application.id, subscribtionToDso.id)
      await payload.apis.vault.write({
        API_KEY: apiKey,
        APPLICATION_ID: application.id,
        USER_ID: apimUser.id,
      }, 'APIM')

      console.log(`Secret created in vault for projet: ${project}`)

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
    } else {
      return {
        status: {
          result: 'OK',
          message: 'Created',
        },
        result: {
          existingApp,
          apimUser,
        },
      }
    }
  } catch (error) {
    console.log('Error while loading plugin APIM')
    return {
      status: {
        result: 'OK',
        message: 'Some APIM Error but okay ...',
      },
      error: JSON.stringify(error),
    }
  }
}

export const archiveProject: StepCall<ArchiveProjectExecArgs> = async (payload) => {
  try {
    // todo delete le user lorsqu'il n'a plus de projet
    const { project, organization, owner } = payload.args
    const kcClient = await getkcClient()
    const kcUser = await getUserById(kcClient, owner.id)
    const projectName = `${organization}-${project}`
    const applicationId = kcUser.attributes[projectName]
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
        result: 'OK',
        message: 'Some APIM Error but okay ...',
      },
    }
  }
}

export const getProjectSecrets: StepCall<GetProjectSecretsExecArgs> = async (payload) => {
  try {
    if (!payload.apis.vault) throw Error('no Vault available')
    // TODO déplacer les secrets dans un dossier pour tout lister plutôt que de sélectionner dans le code
    console.log('List secret APIM for project ')
    const apim = (await payload.apis.vault.read('APIM')).data
    const gitlabSecrets = (await payload.apis.vault.read('GITLAB')).data
    const apiKey = apim.API_KEY
    const commandTab = [
      `curl --location --request POST '${getConfig().gatewayUrl}/gitlab-dso/${gitlabSecrets.GIT_MIRROR_PROJECT_ID}/trigger/pipeline'`,
      `--header 'X-Gravitee-Api-Key: ${apiKey}'`,
      `--form 'token=${gitlabSecrets.GIT_MIRROR_TOKEN}'`,
      '--form \'ref="main"\'',
      '--form \'variables[PROJECT_NAME]="A REMPLACER"\'',
      '--form \'variables[BRANCH_NAME]="A REMPLACER"\'',
    ].join('\\\n')
    return {
      status: {
        result: 'OK',
        message: 'secret retrieved',
      },
      secrets: {
        'API-KEY': apiKey,
        'CURL-CMD-GATEWAY': commandTab,
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
