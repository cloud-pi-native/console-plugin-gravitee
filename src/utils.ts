import KeycloakAdminClient from '@keycloak/keycloak-admin-client'
import { requiredEnv } from '@cpn-console/shared'
import UserRepresentation from '@keycloak/keycloak-admin-client/lib/defs/userRepresentation.js'

export const removeTrailingSlash = (url: string | undefined) => url?.endsWith('/')
  ? url?.slice(0, -1)
  : url

const config: {
  apimUrl?: string,
  apimToken?: string,
  apimApiId?: string,
  apimPlanId?: string,
  gatewayUrl?: string,
  keycloakProtocol?: string,
  keycloakDomain?: string,
  keycloakRealm?: string,
  keycloakUser?: string,
  keycloakToken?: string,
} = {
  apimUrl: undefined,
  apimToken: undefined,
  apimApiId: undefined,
  apimPlanId: undefined,
  gatewayUrl: undefined,
  keycloakProtocol: undefined,
  keycloakDomain: undefined,
  keycloakRealm: undefined,
  keycloakUser: undefined,
  keycloakToken: undefined,
}

export const getConfig = (): Required<typeof config> => {
  config.apimUrl = removeTrailingSlash(requiredEnv('GRAVITEE_APIM_URL'))
  config.apimToken = config.apimToken ?? requiredEnv('GRAVITEE_APIM_TOKEN')
  config.apimApiId = config.apimApiId ?? requiredEnv('GRAVITEE_APIM_API_ID')
  config.apimPlanId = config.apimPlanId ?? requiredEnv('GRAVITEE_APIM_PLAN_ID')
  config.gatewayUrl = removeTrailingSlash(requiredEnv('GRAVITEE_GATEWAY_URL'))
  config.keycloakProtocol = config.keycloakProtocol ?? requiredEnv('KEYCLOAK_PROTOCOL')
  config.keycloakDomain = config.keycloakDomain ?? requiredEnv('KEYCLOAK_DOMAIN')
  config.keycloakRealm = config.keycloakRealm ?? requiredEnv('KEYCLOAK_REALM')
  config.keycloakUser = config.keycloakUser ?? requiredEnv('KEYCLOAK_ADMIN')
  config.keycloakToken = config.keycloakToken ?? requiredEnv('KEYCLOAK_ADMIN_PASSWORD')

  // @ts-ignore
  return config
}

export const axiosOptions = {
  baseURL: `${getConfig().apimUrl}`,
  headers: { Authorization: 'Bearer ' + getConfig().apimToken },
}

interface ApiOwner {
  id: string;
  displayName: string;
}

export interface ApiModel {
  id: string;
  name: string;
  version: string;
  owner: ApiOwner;
}

export interface PlanModel {
  id: string;
  name: string;
  security: string;
}

interface SubscribedBy {
  id: string;
  displayName: string;
}

export interface SubscriptionModel {
  id: string;
  api: ApiModel;
  plan: PlanModel;
  status: string;
  processed_at: number;
  processed_by: string;
  subscribed_by: SubscribedBy;
  starting_at: number;
  created_at: number;
  updated_at: number;
}

interface RolePermissions {
  [key: string]: string[];
}

interface Role {
  id: string;
  name: string;
  scope: string;
  permissions: RolePermissions;
}

export interface UserModel {
  id: string;
  firstname: string;
  lastname: string;
  email: string;
  roles: Role[];
  envRoles: {
    DEFAULT: Role[];
  };
  source: string;
  sourceId: string;
  status: string;
  loginCount: number;
  displayName: string;
  created_at: number;
  updated_at: number;
  primary_owner: boolean;
  number_of_active_tokens: number;
}

export const getkcClient = async () => {
  const kcClient = new KeycloakAdminClient({
    baseUrl: `${getConfig().keycloakProtocol}://${getConfig().keycloakDomain}`,
  })

  await kcClient.auth({
    clientId: 'admin-cli',
    grantType: 'password',
    username: getConfig().keycloakUser,
    password: getConfig().keycloakToken,
  })
  kcClient.setConfig({ realmName: getConfig().keycloakRealm })
  return kcClient
}

export const addAttributeKeycloak = async (kcUser: UserRepresentation,
  kcClient: KeycloakAdminClient,
  key: string,
  value: any,
) => {
  if (!kcUser.id) {
    throw new Error('Error while updating kc user attributes, no userId')
  }
  try {
    kcUser.attributes = { ...kcUser.attributes, [key]: [value] }
    await kcClient.users.update({ id: kcUser.id }, kcUser)
    return kcUser
  } catch (e) {
    console.error('update user keycloak attributes error', e)
    throw new Error('Error while updating kc user attributes')
  }
}

export const removeAttributeKeycloak = async (
  kcUser: UserRepresentation,
  kcClient: KeycloakAdminClient,
  attributeName: string,
) => {
  if (!kcUser.id) {
    throw new Error('Error while removing kc user attributes, no userId')
  }
  try {
    // Supprimer l'attribut spécifié
    if (kcUser.attributes && attributeName in kcUser.attributes) {
      delete kcUser.attributes[attributeName]
    }

    // Mettre à jour l'utilisateur Keycloak
    await kcClient.users.update({ id: kcUser.id }, kcUser)

    return kcUser
  } catch (e) {
    console.error('remove user keycloak attribute error', e)
    throw new Error('Error while updating kc user attributes')
  }
}
