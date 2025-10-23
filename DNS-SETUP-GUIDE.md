# DNS Configuration Guide for Hostinger

## Setting up chat.laurelin-inc.com

### Step 1: Access Hostinger DNS Management

1. Log into your Hostinger control panel
2. Go to **Domains** → **Manage** → **DNS Zone Editor**
3. Select your `laurelin-inc.com` domain

### Step 2: Add CNAME Record for Chat Subdomain

Add the following DNS record:

```
Type: CNAME
Name: chat
Value: c.storage.googleapis.com
TTL: 3600 (or default)
```

This will create `chat.laurelin-inc.com` pointing to Google Cloud Storage.

### Step 3: Add CNAME Record for OSS120 Model (Optional)

If you want a dedicated subdomain for your OSS120 model:

```
Type: CNAME
Name: oss120
Value: [EXTERNAL_IP_FROM_LOADBALANCER] (will be provided after OSS120 setup)
TTL: 3600 (or default)
```

### Step 4: Verify DNS Propagation

After adding the records, wait 5-15 minutes for DNS propagation, then test:

```bash
# Test chat subdomain
nslookup chat.laurelin-inc.com

# Test OSS120 subdomain (after setup)
nslookup oss120.laurelin-inc.com
```

### Step 5: Configure Google Cloud Storage Bucket

1. Create a bucket named exactly `chat.laurelin-inc.com`:
   ```bash
   gsutil mb gs://chat.laurelin-inc.com
   ```

2. Configure the bucket for website hosting:
   ```bash
   gsutil web set -m index.html -e 404.html gs://chat.laurelin-inc.com
   ```

3. Set public read access:
   ```bash
   gsutil iam ch allUsers:objectViewer gs://chat.laurelin-inc.com
   ```

### Step 6: SSL Certificate (Automatic)

Google Cloud Storage automatically provides SSL certificates for custom domains. No additional configuration needed.

## Troubleshooting

### If DNS doesn't resolve:
1. Check TTL settings (use 300 seconds for faster updates)
2. Clear your DNS cache: `sudo dscacheutil -flushcache` (macOS)
3. Use different DNS servers (8.8.8.8, 1.1.1.1) to test

### If HTTPS doesn't work:
1. Wait up to 24 hours for SSL certificate provisioning
2. Check that the bucket name exactly matches the domain
3. Verify the CNAME record is correct

### If you get 404 errors:
1. Ensure the bucket is configured for website hosting
2. Check that `index.html` exists in the bucket root
3. Verify public read permissions are set

## Expected Results

After successful setup:
- `https://chat.laurelin-inc.com` → Your Angular chatbot frontend
- `https://oss120.laurelin-inc.com` → Your OSS120 model endpoint (optional)

## Security Notes

- The chat subdomain will be publicly accessible
- Only users with `@laurelin-inc.com` email addresses can authenticate
- All API calls require valid authentication tokens
- File uploads are limited to 1GB per file
