# S3 Setup for QuickMeazure Style Images

This guide provides instructions on how to set up Amazon S3 for storing style images in QuickMeazure.

## Prerequisites

1. An AWS account. If you don't have one, you can create one at [AWS](https://aws.amazon.com/).

## Setting Up S3 Bucket

1. **Create an S3 Bucket**:
   - Sign in to the AWS Management Console and navigate to the S3 service.
   - Click "Create bucket".
   - Enter a globally unique bucket name (e.g., "quickmeazure-styles").
   - Select the AWS Region closest to your users for better performance.
   - Configure other settings as needed (public access, versioning, etc.).
   - Create the bucket.

2. **Configure CORS** (if your application requires cross-origin requests):
   - In your bucket settings, navigate to the "Permissions" tab.
   - Scroll down to "Cross-origin resource sharing (CORS)".
   - Add a CORS configuration like the following:
   ```json
   [
     {
       "AllowedOrigins": ["https://yourdomain.com", "http://localhost:3000"],
       "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
       "AllowedHeaders": ["*"],
       "ExposeHeaders": ["ETag"]
     }
   ]
   ```

3. **Set Up Bucket Policy** (if your images need public access):
   - In the "Permissions" tab, click on "Bucket policy".
   - If your images need to be publicly accessible, you might want to add a policy like:
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Sid": "PublicReadGetObject",
         "Effect": "Allow",
         "Principal": "*",
         "Action": "s3:GetObject",
         "Resource": "arn:aws:s3:::your-bucket-name/*"
       }
     ]
   }
   ```
   - Replace "your-bucket-name" with your actual bucket name.

## Creating IAM Credentials

1. **Create an IAM User**:
   - Go to the IAM service in the AWS Console.
   - Navigate to "Users" and click "Create user".
   - Enter a name (e.g., "quickmeazure-app").
   - Select "Programmatic access" for access type.
   - Click "Next: Permissions".

2. **Attach Permissions**:
   - You can either attach an existing policy or create a new one.
   - For a new policy, select "Create policy" and use JSON format.
   - Use a policy that restricts access to just the operations needed on your S3 bucket:
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Effect": "Allow",
         "Action": [
           "s3:PutObject",
           "s3:GetObject",
           "s3:DeleteObject"
         ],
         "Resource": [
           "arn:aws:s3:::your-bucket-name/*"
         ]
       },
       {
         "Effect": "Allow",
         "Action": [
           "s3:ListBucket"
         ],
         "Resource": [
           "arn:aws:s3:::your-bucket-name"
         ]
       }
     ]
   }
   ```
   - Replace "your-bucket-name" with your actual bucket name.
   - Review and create the policy, then attach it to your user.

3. **Get Credentials**:
   - After creating the user, you'll be given an Access Key ID and Secret Access Key.
   - Save these securely - you'll need them for the application.

## Configuring the Application

1. **Update Environment Variables**:
   - Open the `.env` file in the project root.
   - Update the AWS credentials:
   ```
   AWS_REGION=us-east-1
   AWS_ACCESS_KEY_ID=your-access-key-id
   AWS_SECRET_ACCESS_KEY=your-secret-access-key
   AWS_S3_BUCKET=your-bucket-name
   AWS_ENDPOINT_URL=https://s3.us-east-1.amazonaws.com
   ```
   - Replace the placeholders with your actual AWS credentials and bucket information.
   - **IMPORTANT**: The `AWS_ENDPOINT_URL` must match the region of your S3 bucket. For example:
     - For US East (N. Virginia): `https://s3.us-east-1.amazonaws.com`
     - For US West (Oregon): `https://s3.us-west-2.amazonaws.com`
     - For EU (Ireland): `https://s3.eu-west-1.amazonaws.com`
     - For S3-compatible services (like MinIO): use their endpoint URL

2. **Verify S3 Bucket Region and Endpoint**:
   - Make sure your bucket is in the same region specified in your AWS_REGION setting
   - S3 buckets are region-specific, and you must use the correct endpoint for that region
   - If you get a "The bucket you are attempting to access must be addressed using the specified endpoint" error, it means your endpoint doesn't match your bucket's region

3. **Restart the Application**:
   - Restart your application to apply the changes.

## Security Considerations

- Never commit AWS credentials to version control.
- Regularly rotate your AWS access keys.
- Follow the principle of least privilege - only grant the permissions that are absolutely necessary.
- Consider using AWS IAM roles for EC2 instances instead of hardcoded credentials when deploying to AWS.

## Troubleshooting

- If uploads fail, check the CloudWatch logs for any error messages.
- Verify that your IAM user has the necessary permissions.
- Check that the CORS configuration is correct if you're uploading directly from the browser.

### Testing Your S3 Connection

We've included a script to test your S3 connection and configuration:

1. Make sure your `.env` file is properly configured with your AWS credentials.
2. Run the test script using:
   ```
   npx tsx server/scripts/test-s3-connection.ts
   ```
3. The script will output:
   - Your environment variable configuration (with credentials partially masked)
   - An attempt to list your S3 buckets
   - A test of your specific bucket access
   - The expected URL format for your uploads

4. Common error messages and solutions:
   - "The specified bucket does not exist": Check your bucket name and region
   - "Invalid access key": Your AWS credentials are incorrect
   - "The bucket you are attempting to access must be addressed using the specified endpoint": You need to set the correct endpoint URL in AWS_ENDPOINT_URL for the region where your bucket is located
   - "Access denied": Your IAM user lacks sufficient permissions to access the bucket 