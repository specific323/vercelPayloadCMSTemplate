'use server'
import { RootLayout } from '@payloadcms/next/layouts'
import { handleServerFunctions } from '@payloadcms/next/layouts'
import config from '@payload-config'
import type { ServerFunctionClient } from 'payload'
import { importMap } from './admin/importMap.js'
import React from 'react'

export { metadata } from '@payloadcms/next/layouts'

type Args = {
  children: React.ReactNode
}

const serverFunctionClient: ServerFunctionClient = async (args) => {
  'use server'
  return handleServerFunctions({
    ...args,
    config,
    importMap,
  })
}

export default async function Layout({ children }: Args) {
  return (
    <RootLayout config={config} importMap={importMap} serverFunction={serverFunctionClient}>
      {children}
    </RootLayout>
  )
}
