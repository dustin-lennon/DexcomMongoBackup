# DexcomMongoBackup

This is a Discord Bot I created to handle daily backups of my MongoDB for my Nightscout site located at https://dexcom.stelth2000inc.com. Every night at 11:59pm, the bot pulls a backup of from mLab, compresses it using 7zip, and then uploads it to my Amazon S3. I have my Amazon S3 set to only keep a week's worth of backups at any given time.

If you like to use this bot yourself:
1. Rename in the config folder `.env.exmaple` to `.env`
2. Open the file and modify  
  a. `BOT_TOKEN`: Your Discord bot token  
  b. `BOT_OWNER_ID`: Your Discord owner Id  
  c. `MONGO_HOST`: Your mblab host address  
  d. `MONGO_USERNAME`: Your mlab database username  
  e. `MONGO_PASSWORD`: Your mlab database password  
  f. `MONGO_PORT`: The port your mongo instance is running on  
  g. `MONGO_DB`: Your mongo database name  
  h. `MONGO_API_KEY`: Your mlab API key  
  i. `AWS_S3_REGION`: Amazon S3 region name  
  j. `AWS_S3_BUCKET`: Amazon S3 bucket to upload to
