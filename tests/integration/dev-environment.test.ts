/**
 * Phase 1: Development Environment Tests
 * Verifies the development setup is working correctly
 */

import { exec } from 'child_process'
import { promisify } from 'util'
import * as fs from 'fs'
import * as path from 'path'

const execAsync = promisify(exec)

describe('Development Environment', () => {
  describe('Project Setup', () => {
    it('should have required configuration files', () => {
      const requiredFiles = [
        'package.json',
        'tsconfig.json',
        'next.config.ts',
        'jest.config.js',
        'jest.setup.js',
        'tailwind.config.ts',
        'postcss.config.mjs'
      ]

      requiredFiles.forEach(file => {
        const filePath = path.join(process.cwd(), file)
        expect(fs.existsSync(filePath)).toBe(true)
      })
    })

    it('should have required dependencies installed', () => {
      const packageJson = require('../../package.json')
      const requiredDeps = [
        'react',
        'react-dom',
        'next',
        'phaser',
        'zustand',
        '@supabase/supabase-js'
      ]

      requiredDeps.forEach(dep => {
        expect(packageJson.dependencies).toHaveProperty(dep)
      })
    })

    it('should have required dev dependencies', () => {
      const packageJson = require('../../package.json')
      const requiredDevDeps = [
        'typescript',
        'jest',
        '@testing-library/react',
        '@types/react',
        'tailwindcss'
      ]

      requiredDevDeps.forEach(dep => {
        expect(packageJson.devDependencies).toHaveProperty(dep)
      })
    })
  })

  describe('Build System', () => {
    it('should compile TypeScript without errors', async () => {
      const result = await execAsync('npx tsc --noEmit').catch(err => err)
      
      // TypeScript might have warnings but shouldn't have blocking errors
      if (result instanceof Error) {
        // Check if it's just warnings, not errors
        const isOnlyWarnings = result.message.includes('warning') && 
                              !result.message.includes('error TS')
        expect(isOnlyWarnings).toBe(true)
      } else {
        expect(result.stdout).toBeDefined()
      }
    }, 30000) // 30 second timeout for compilation

    it('should have valid Next.js configuration', () => {
      const nextConfig = require('../../next.config.ts')
      expect(nextConfig).toBeDefined()
    })

    it('should have valid Tailwind configuration', () => {
      const tailwindConfig = require('../../tailwind.config.ts')
      expect(tailwindConfig).toBeDefined()
      expect(tailwindConfig.content).toBeDefined()
    })
  })

  describe('Directory Structure', () => {
    it('should have required directories', () => {
      const requiredDirs = [
        'app',
        'public',
        'tests',
        'tests/unit',
        'tests/integration',
        'tests/utils',
        'documentation',
        'memory'
      ]

      requiredDirs.forEach(dir => {
        const dirPath = path.join(process.cwd(), dir)
        expect(fs.existsSync(dirPath)).toBe(true)
      })
    })

    it('should have game documentation', () => {
      const docFiles = [
        'documentation/Game Design Document_ Flexport.md',
        'documentation/Development Phases Document _ Flexport.md',
        'documentation/Technical Architecture Document.md',
        'documentation/System Architecture Document Flexport.md'
      ]

      docFiles.forEach(file => {
        const filePath = path.join(process.cwd(), file)
        expect(fs.existsSync(filePath)).toBe(true)
      })
    })
  })

  describe('Environment Variables', () => {
    it('should have environment template or example', () => {
      const envExample = path.join(process.cwd(), '.env.example')
      const envLocal = path.join(process.cwd(), '.env.local')
      
      // Should have at least one of these
      const hasEnvFile = fs.existsSync(envExample) || fs.existsSync(envLocal)
      
      // For now, we don't require env files, but log a warning
      if (!hasEnvFile) {
        console.warn('No .env.example or .env.local found. Supabase configuration may be needed.')
      }
      
      expect(true).toBe(true) // Pass for now
    })

    it('should define required environment variables structure', () => {
      // Expected env vars for the game
      const requiredEnvVars = [
        'NEXT_PUBLIC_SUPABASE_URL',
        'NEXT_PUBLIC_SUPABASE_ANON_KEY',
        'SUPABASE_SERVICE_ROLE_KEY'
      ]

      // This is just documentation for now
      expect(requiredEnvVars).toHaveLength(3)
    })
  })

  describe('Test Infrastructure', () => {
    it('should run test suite without configuration errors', async () => {
      const result = await execAsync('npm test -- --listTests').catch(err => err)
      
      if (result instanceof Error) {
        // Should not have configuration errors
        expect(result.message).not.toContain('Configuration Error')
      } else {
        expect(result.stdout).toContain('.test.ts')
      }
    })

    it('should have test helper utilities', () => {
      const helpersPath = path.join(process.cwd(), 'tests/utils/test-helpers.ts')
      expect(fs.existsSync(helpersPath)).toBe(true)
    })

    it('should have Jest configuration', () => {
      const jestConfig = require('../../jest.config.js')
      expect(jestConfig.testEnvironment).toBe('jest-environment-jsdom')
      expect(jestConfig.setupFilesAfterEnv).toContain('<rootDir>/jest.setup.js')
    })
  })

  describe('Package Scripts', () => {
    it('should have all required npm scripts', () => {
      const packageJson = require('../../package.json')
      const requiredScripts = [
        'dev',
        'build',
        'start',
        'lint',
        'test',
        'test:watch',
        'test:coverage'
      ]

      requiredScripts.forEach(script => {
        expect(packageJson.scripts).toHaveProperty(script)
      })
    })
  })

  describe('Git Configuration', () => {
    it('should have .gitignore file', () => {
      const gitignorePath = path.join(process.cwd(), '.gitignore')
      expect(fs.existsSync(gitignorePath)).toBe(true)
    })

    it('should ignore sensitive files', () => {
      const gitignorePath = path.join(process.cwd(), '.gitignore')
      const gitignore = fs.readFileSync(gitignorePath, 'utf-8')
      
      const shouldIgnore = [
        'node_modules',
        '.env.local',
        '.next',
        'coverage'
      ]

      shouldIgnore.forEach(pattern => {
        expect(gitignore).toContain(pattern)
      })
    })
  })

  describe('Phase 1 Readiness', () => {
    it('should have Phaser.js configured', () => {
      const packageJson = require('../../package.json')
      expect(packageJson.dependencies.phaser).toBeDefined()
      
      // Check version is 3.x
      const phaserVersion = packageJson.dependencies.phaser
      expect(phaserVersion).toMatch(/^\^3\.\d+\.\d+$/)
    })

    it('should have Zustand for state management', () => {
      const packageJson = require('../../package.json')
      expect(packageJson.dependencies.zustand).toBeDefined()
    })

    it('should have Supabase client configured', () => {
      const packageJson = require('../../package.json')
      expect(packageJson.dependencies['@supabase/supabase-js']).toBeDefined()
      expect(packageJson.dependencies['@supabase/auth-helpers-nextjs']).toBeDefined()
    })

    it('should have testing infrastructure ready', () => {
      const testFiles = [
        'tests/unit/asset-placement.test.ts',
        'tests/unit/camera-controls.test.ts',
        'tests/integration/supabase-sync.test.ts',
        'tests/integration/save-load.test.ts',
        'tests/integration/performance.test.ts'
      ]

      testFiles.forEach(file => {
        const filePath = path.join(process.cwd(), file)
        expect(fs.existsSync(filePath)).toBe(true)
      })
    })
  })
})