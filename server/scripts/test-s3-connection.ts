import { S3Client, ListBucketsCommand, HeadBucketCommand } from '@aws-sdk/client-s3'
import * as dotenv from 'dotenv'

// Load environment variables
dotenv.config()

// Function to test S3 connection
async function testS3Connection() {
  try {
    console.log('\n--- S3 Connection Test ---')

    // Check environment variables
    console.log('\nEnvironment Variables:')
    console.log(`- AWS_REGION: ${process.env.AWS_REGION || 'Not set'}`)
    console.log(
      `- AWS_ENDPOINT_URL: ${process.env.AWS_ENDPOINT_URL || 'Not set (using default AWS endpoint)'}`
    )
    console.log(`- AWS_S3_BUCKET: ${process.env.AWS_S3_BUCKET || 'Not set'}`)
    console.log(
      `- AWS_ACCESS_KEY_ID: ${process.env.AWS_ACCESS_KEY_ID ? '******' + process.env.AWS_ACCESS_KEY_ID.slice(-4) : 'Not set'}`
    )
    console.log(
      `- AWS_SECRET_ACCESS_KEY: ${process.env.AWS_SECRET_ACCESS_KEY ? '******' : 'Not set'}`
    )

    // Initialize S3 client
    const s3Client = new S3Client({
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
      },
      endpoint: process.env.AWS_ENDPOINT_URL,
      forcePathStyle: true,
    })

    console.log('\nTesting S3 Client setup...')
    console.log('Attempting to list S3 buckets...')

    // Test listing buckets
    const listBucketsResponse = await s3Client.send(new ListBucketsCommand({}))
    console.log(`Success! Found ${listBucketsResponse.Buckets?.length || 0} buckets:`)
    listBucketsResponse.Buckets?.forEach(bucket => {
      console.log(`- ${bucket.Name}`)
    })

    // Test bucket access if bucket name is provided
    if (process.env.AWS_S3_BUCKET) {
      console.log(`\nTesting access to bucket "${process.env.AWS_S3_BUCKET}"...`)

      try {
        const headBucketResponse = await s3Client.send(
          new HeadBucketCommand({ Bucket: process.env.AWS_S3_BUCKET })
        )
        console.log('Success! Bucket exists and is accessible.')
        console.log('Response metadata:', headBucketResponse.$metadata)

        // Generate expected URL pattern
        const region = process.env.AWS_REGION || 'us-east-1'
        const baseUrl =
          process.env.AWS_ENDPOINT_URL ||
          (region === 'us-east-1'
            ? `https://${process.env.AWS_S3_BUCKET}.s3.amazonaws.com`
            : `https://${process.env.AWS_S3_BUCKET}.s3.${region}.amazonaws.com`)

        const testObjectUrl = process.env.AWS_ENDPOINT_URL
          ? `${baseUrl}/${process.env.AWS_S3_BUCKET}/test-object-key`
          : `${baseUrl}/test-object-key`

        console.log('\nObject URLs will be formatted as:')
        console.log(testObjectUrl)
      } catch (error: any) {
        console.error('Error accessing bucket:', error.message)

        // Extract redirect information from the error
        if (error.$metadata?.httpStatusCode === 301) {
          console.error(`\n🚨 IMPORTANT: Bucket exists but is in a DIFFERENT REGION`)

          // Check for redirect URL in the headers
          const redirectLocation = error.$metadata.httpHeaders?.['x-amz-bucket-region']
          if (redirectLocation) {
            console.log(
              `\n✅ SOLUTION: Update your AWS_REGION to "${redirectLocation}" in .env file`
            )

            // Show what the correct configuration should be
            console.log('\nCorrect configuration:')
            console.log('```')
            console.log('AWS_REGION=' + redirectLocation)
            console.log('AWS_ACCESS_KEY_ID=' + process.env.AWS_ACCESS_KEY_ID)
            console.log('AWS_SECRET_ACCESS_KEY=' + process.env.AWS_SECRET_ACCESS_KEY)
            console.log('AWS_S3_BUCKET=' + process.env.AWS_S3_BUCKET)
            console.log('# AWS_ENDPOINT_URL=not needed')
            console.log('```')
          } else {
            // Try to extract region from the error message
            const regionMatch = error.message?.match(
              /\b(us|eu|ap|ca|me|sa)-(east|west|central|north|south|northeast|southeast|southwest|northwest)-(1|2|3)\b/
            )
            if (regionMatch) {
              const extractedRegion = regionMatch[0]
              console.log(
                `\n✅ SOLUTION: Update your AWS_REGION to "${extractedRegion}" in .env file`
              )

              // Show what the correct configuration should be
              console.log('\nCorrect configuration:')
              console.log('```')
              console.log('AWS_REGION=' + extractedRegion)
              console.log('AWS_ACCESS_KEY_ID=' + process.env.AWS_ACCESS_KEY_ID)
              console.log('AWS_SECRET_ACCESS_KEY=' + process.env.AWS_SECRET_ACCESS_KEY)
              console.log('AWS_S3_BUCKET=' + process.env.AWS_S3_BUCKET)
              console.log('# AWS_ENDPOINT_URL=not needed')
              console.log('```')
            }
          }
        } else if (error.name === 'NoSuchBucket') {
          console.error(`Bucket "${process.env.AWS_S3_BUCKET}" does not exist.`)
        } else {
          console.error('Full error:', error)
        }
      }
    }

    console.log('\n--- Test Complete ---')
  } catch (error: any) {
    console.error('\nFailed to connect to S3:', error.message)
    console.error('Error details:', error)
  }
}

// Run the test
testS3Connection()
