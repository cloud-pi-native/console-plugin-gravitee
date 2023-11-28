// @ts-nocheck
import type KeycloakAdminClient from '@keycloak/keycloak-admin-client'
import type UserRepresentation from '@keycloak/keycloak-admin-client/lib/defs/userRepresentation'

export const removeTrailingSlash = (url: string | undefined) => url?.endsWith('/')
  ? url?.slice(0, -1)
  : url

export const apimUrl = removeTrailingSlash(process.env.APIM_URL)
export const apimToken = process.env.APIM_TOKEN
export const apimApiId = process.env.APIM_API_ID
export const apimPlanId = process.env.APIM_PLAN_ID
export const axiosOptions = {
  baseURL: `${apimUrl}`,
  headers: { Authorization: 'Bearer ' + apimToken },
}

export const keycloakProtocol = process.env.KEYCLOAK_PROTOCOL
export const keycloakDomain = process.env.KEYCLOAK_DOMAIN
export const keycloakRealm = process.env.KEYCLOAK_REALM

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

export const addAttributeKeycloak = async (kcUser: UserRepresentation,
  kcClient: KeycloakAdminClient,
  key: string,
  value: any) => {
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
  try {
    // Supprimer l'attribut spécifié
    if (kcUser.attributes && attributeName in kcUser.attributes) {
      delete kcUser.attributes[attributeName]
    }

    // Mettre à jour l'utilisateur Keycloak
    await kcClient.users.update({ id: kcUser.id }, kcUser)

    return kcUser
  } catch (e) {
    console.log('remove user keycloak attribute error', e)
    throw new Error('Error while updating kc user attributes')
  }
}
