"use client"

import React from 'react'

import { AccountActions } from '@/module/settings/components/account-actions'
import { ProfileForm } from '@/module/settings/components/profile-form'
import { RepositoryList } from '@/module/settings/components/repository-list'

const SettingsPage = () => {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Manage your Orvix account.
        </p>
      </div>

      <ProfileForm />
      <RepositoryList />
      <AccountActions />
    </div>
  )
}

export default SettingsPage
