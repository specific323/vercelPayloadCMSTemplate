import { RootLayout, metadata } from '@payloadcms/next/layouts'
import config from '@payload-config'
import { importMap } from './admin/importMap.js'
import { payloadServerFunction } from './serverFunction.js'
import type { ServerFunctionClient } from 'payload'
import React from 'react'

export { metadata }

type Args = {
  children: React.ReactNode
}

export default async function Layout({ children }: Args) {
  return (
    <RootLayout
      config={config}
      importMap={importMap}
      serverFunction={payloadServerFunction as unknown as ServerFunctionClient}
    >
      {children}
    </RootLayout>
  )
}
