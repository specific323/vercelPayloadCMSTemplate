import { RootLayout, handleServerFunctions } from '@payloadcms/next/layouts'
import config from '@payload-config'
import { importMap } from './admin/importMap.js'
import React from 'react'
import '@payloadcms/next/css'

export const metadata = {
  description: 'Payload Admin Panel',
  title: 'Payload Admin',
}

type Args = {
  children: React.ReactNode
}

export default async function Layout({ children }: Args) {
  const serverFunction = async (args: Parameters<typeof handleServerFunctions>[0]) => {
    'use server'
    return handleServerFunctions({
      ...args,
      config,
      importMap,
    })
  }

  return (
    <RootLayout
      config={config}
      importMap={importMap}
      serverFunction={serverFunction as any}
    >
      {children}
    </RootLayout>
  )
}
