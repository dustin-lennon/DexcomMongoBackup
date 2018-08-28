# DexcomMongoBackup

This is a Discord Bot I created to handle daily backups of my MongoDB for my Nightscout site located at https://dexcom.stelth2000inc.com. Every night at 11:59pm, the bot pulls a backup of from mLab, compresses it using 7zip, and then uploads it to my Amazon S3. I have my Amazon S3 set to only keep a week's worth of backups at any given time.

If you like to use this bot yourself:
1. Rename in the config folder `config.json.rename` to `config.json`
2. Open the file and modify  
  a. `bot.token`: Your Discord bot token  
  b. `bot.ownerId`: Your Discord owner Id  
  c. `mongo.host`: Your mblab host address  
  d. `mongo.username`: Your mlab database username  
  e. `mongo.password`: Your mlab database password  
  f. `mongo.port`: The port your mongo instance is running on  
  g. `mongo.database`: Your mongo database name  
  h. `mongo.apiKey`: Your mlab API key  
  i. `s3.region`: Amazon S3 region name  
  j. `s3.bucket`: Amazon S3 bucket to upload to
