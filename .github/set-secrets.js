#!/usr/bin/env node

/**
 * GitHub Secrets Setup Script
 * Sets all secrets from .env file to GitHub repository
 * 
 * Usage:
 *   GITHUB_TOKEN=your_token node .github/set-secrets.js
 * 
 * Or with GitHub CLI authenticated:
 *   node .github/set-secrets.js
 */

const fs = require('fs');
const { execSync } = require('child_process');
const https = require('https');

const REPO_OWNER = 'Sharjeel-Saleem-06';
const REPO_NAME = 'CodeSentinel';
const ENV_FILE = 'codescan-pro/.env';

// Get GitHub token
function getToken() {
    // Try environment variable first
    if (process.env.GITHUB_TOKEN) {
        return process.env.GITHUB_TOKEN;
    }
    
    // Try GitHub CLI
    try {
        return execSync('gh auth token', { encoding: 'utf-8' }).trim();
    } catch (e) {
        return null;
    }
}

// Read .env file
function readEnvFile() {
    if (!fs.existsSync(ENV_FILE)) {
        console.error(`❌ ${ENV_FILE} not found!`);
        process.exit(1);
    }
    
    const content = fs.readFileSync(ENV_FILE, 'utf-8');
    const vars = {};
    
    content.split('\n').forEach(line => {
        line = line.trim();
        if (line && !line.startsWith('#') && line.includes('=')) {
            const [key, ...valueParts] = line.split('=');
            const value = valueParts.join('=').trim().replace(/^["']|["']$/g, '');
            if (value && key.startsWith('VITE_')) {
                vars[key.trim()] = value;
            }
        }
    });
    
    return vars;
}

// Make HTTPS request
function makeRequest(options, data) {
    return new Promise((resolve, reject) => {
        const req = https.request(options, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                resolve({ statusCode: res.statusCode, body });
            });
        });
        
        req.on('error', reject);
        
        if (data) {
            req.write(JSON.stringify(data));
        }
        
        req.end();
    });
}

// Get public key
async function getPublicKey(token) {
    const options = {
        hostname: 'api.github.com',
        path: `/repos/${REPO_OWNER}/${REPO_NAME}/actions/secrets/public-key`,
        method: 'GET',
        headers: {
            'Authorization': `token ${token}`,
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'Node.js'
        }
    };
    
    const response = await makeRequest(options);
    
    if (response.statusCode !== 200) {
        throw new Error(`Failed to get public key: ${response.statusCode}`);
    }
    
    return JSON.parse(response.body);
}

// Encrypt secret (requires libsodium - we'll use a simple approach)
// Note: For production, use proper encryption library
async function encryptSecret(publicKey, secretValue, keyId) {
    // This is a simplified version - in production use proper encryption
    // For now, we'll use GitHub CLI if available, or prompt user
    try {
        // Try using gh secret set which handles encryption
        return { encrypted: true, method: 'gh-cli' };
    } catch (e) {
        throw new Error('Encryption requires GitHub CLI or PyNaCl library');
    }
}

// Set secret using GitHub CLI (simplest method)
function setSecretWithCLI(secretName, secretValue) {
    try {
        execSync(`echo -n "${secretValue}" | gh secret set ${secretName} --repo ${REPO_OWNER}/${REPO_NAME}`, {
            stdio: 'inherit'
        });
        return true;
    } catch (e) {
        return false;
    }
}

// Main function
async function main() {
    console.log('🔐 GitHub Secrets Setup');
    console.log('='.repeat(50));
    console.log('');
    
    // Get token
    const token = getToken();
    if (!token) {
        console.error('❌ GitHub token not found!');
        console.error('');
        console.error('Option 1: Set GITHUB_TOKEN environment variable');
        console.error('   GITHUB_TOKEN=your_token node .github/set-secrets.js');
        console.error('');
        console.error('Option 2: Authenticate GitHub CLI');
        console.error('   gh auth login');
        console.error('   node .github/set-secrets.js');
        process.exit(1);
    }
    
    console.log('✅ GitHub token found');
    
    // Read .env
    console.log(`📖 Reading ${ENV_FILE}...`);
    const envVars = readEnvFile();
    console.log(`✅ Found ${Object.keys(envVars).length} environment variables`);
    console.log('');
    
    // Check if gh CLI is available
    let useCLI = false;
    try {
        execSync('gh --version', { stdio: 'ignore' });
        useCLI = true;
        console.log('✅ Using GitHub CLI for encryption');
    } catch (e) {
        console.log('⚠️  GitHub CLI not found - will use API (requires PyNaCl)');
    }
    console.log('');
    
    // Set secrets
    console.log('🔑 Setting secrets...');
    let success = 0;
    let failed = 0;
    
    for (const [key, value] of Object.entries(envVars)) {
        process.stdout.write(`   Setting ${key}... `);
        
        if (useCLI) {
            if (setSecretWithCLI(key, value)) {
                console.log('✅');
                success++;
            } else {
                console.log('❌');
                failed++;
            }
        } else {
            // Would need to implement API method with encryption
            console.log('⚠️  (Requires GitHub CLI)');
            failed++;
        }
    }
    
    console.log('');
    console.log('='.repeat(50));
    console.log(`✅ Successfully set: ${success} secrets`);
    if (failed > 0) {
        console.log(`❌ Failed: ${failed} secrets`);
    }
    console.log('');
    console.log('📋 Don\'t forget to set Netlify secrets:');
    console.log('   NETLIFY_AUTH_TOKEN');
    console.log('   NETLIFY_SITE_ID');
    console.log('');
    console.log('🎉 Done!');
}

main().catch(console.error);
