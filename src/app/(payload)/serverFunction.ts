'use server'
import { handleServerFunctions } from '@payloadcms/next/layouts'
import config from '@payload-config'
import { importMap } from './admin/importMap.js'

export const payloadServerFunction = async (args: Parameters<typeof handleServerFunctions>[0]) => {
  'use server'
  return handleServerFunctions({ ...args, config, importMap })
}
