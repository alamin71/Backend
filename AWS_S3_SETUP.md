# AWS S3 Setup Guide

## 📦 Installation

```bash
npm install @aws-sdk/client-s3 @aws-sdk/lib-storage
```

## 🔧 AWS S3 Configuration

### 1. Create AWS Account

- Go to [AWS Console](https://aws.amazon.com/)
- Sign up or sign in

### 2. Create IAM User

1. Go to **IAM** → **Users** → **Create user**
2. Username: `backend-s3-user`
3. Select **Programmatic access**
4. Attach policies: `AmazonS3FullAccess`
5. **Save Access Key ID and Secret Access Key**

### 3. Create S3 Bucket

1. Go to **S3** → **Create bucket**
2. Bucket name: `your-app-uploads` (must be globally unique)
3. Region: Select your region (e.g., `ap-south-1` for Mumbai)
4. **Block Public Access**: Uncheck (for public file access)
5. Create bucket

### 4. Set Bucket Policy (Optional - for public access)

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::your-app-uploads/*"
    }
  ]
}
```

### 5. Enable CORS (for browser uploads)

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
    "AllowedOrigins": ["*"],
    "ExposeHeaders": []
  }
]
```

## ⚙️ Environment Variables

Add to `.env` file:

```env
AWS_ACCESS_KEY_ID=your-aws-access-key-id
AWS_SECRET_ACCESS_KEY=your-aws-secret-access-key
AWS_REGION=ap-south-1
AWS_S3_BUCKET_NAME=your-app-uploads
```

## 🚀 Usage

### Upload Single File

```typescript
import { s3Helper } from './helpers/s3Helper';
import s3FileUploadHandler from './app/middleware/s3FileUploadHandler';

// In your route
router.post(
  '/upload',
  s3FileUploadHandler().single('image'),
  async (req, res) => {
    const file = req.file;
    const fileUrl = await s3Helper.uploadToS3(file, 'images');

    res.json({ url: fileUrl });
  }
);
```

### Upload Multiple Files

```typescript
router.post(
  '/upload-multiple',
  s3FileUploadHandler().array('images', 5),
  async (req, res) => {
    const files = req.files as Express.Multer.File[];
    const fileUrls = await s3Helper.uploadMultipleToS3(files, 'images');

    res.json({ urls: fileUrls });
  }
);
```

### Upload Different File Types

```typescript
// Image
s3FileUploadHandler().single('image');

// Logo
s3FileUploadHandler().single('logo');

// Document
s3FileUploadHandler().single('document');

// Audio
s3FileUploadHandler().single('audio');

// Video
s3FileUploadHandler().single('video');
```

## 📁 Folder Structure in S3

```
your-bucket/
├── images/
│   └── 1234567890-photo.jpg
├── documents/
│   └── 1234567890-file.pdf
├── videos/
│   └── 1234567890-video.mp4
└── uploads/
    └── 1234567890-file.png
```

## 🔒 Security Best Practices

1. **Never commit AWS credentials** - Always use environment variables
2. **Use IAM roles** in production (EC2, Lambda, ECS)
3. **Enable versioning** on S3 bucket
4. **Enable encryption** at rest
5. **Set lifecycle policies** to delete old files
6. **Use CloudFront** for CDN (optional)

## 💰 Pricing

- **Free tier**: 5GB storage, 20,000 GET requests, 2,000 PUT requests per month
- After free tier: ~$0.023 per GB/month

## 🔄 Migration from Local to S3

Replace this:

```typescript
import fileUploadHandler from './middleware/fileUploadHandler';
```

With this:

```typescript
import s3FileUploadHandler from './middleware/s3FileUploadHandler';
```

## 📝 Notes

- Files are publicly accessible via URL
- File URL format: `https://bucket-name.s3.region.amazonaws.com/folder/filename`
- Supports images, audio, video, and documents
- Max file size: 5MB (configurable in middleware)

## 🐛 Troubleshooting

### Access Denied Error

- Check IAM user permissions
- Verify bucket policy allows public read
- Check AWS credentials in `.env`

### CORS Error

- Add CORS configuration to S3 bucket
- Check allowed origins in CORS settings

### File Not Found

- Verify bucket name in `.env`
- Check file was uploaded successfully
- Verify public access settings

---

**Ready to use! 🚀**
