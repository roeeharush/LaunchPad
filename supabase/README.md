# Supabase setup

These files are checked into the repo but not executed automatically. Apply them manually in your Supabase project.

## 1. Run the initial schema

Open the Supabase SQL editor and run the contents of [`migrations/001_initial_schema.sql`](./migrations/001_initial_schema.sql). This creates four tables (`resumes`, `profile_analyses`, `job_analyses`, `trend_bookmarks`) with row-level security enabled and per-user access policies.

## 2. Create the `resumes` storage bucket

In the Supabase dashboard, go to **Storage** and create a new bucket named `resumes`. Mark it as **private** (not public).

## 3. Add storage policies

Each user's files are stored under a top-level folder named after their `auth.uid()`. Add these two policies to the `resumes` bucket:

### INSERT policy

```sql
(bucket_id = 'resumes' AND auth.uid()::text = (storage.foldername(name))[1])
```

### SELECT policy

```sql
(bucket_id = 'resumes' AND auth.uid()::text = (storage.foldername(name))[1])
```

Both policies ensure users can only upload to and read from their own folder inside the `resumes` bucket.
