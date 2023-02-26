import { TextChannel, ChannelType, ThreadAutoArchiveDuration } from 'discord.js';
import { blue, magenta, magentaBright, white } from 'colorette';
import { mkdirp } from 'mkdirp'
import { spawn } from 'child_process';
import { S3Client, } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";

import * as moment from 'moment';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { envParseString } from '@skyra/env-utilities';

const dev = process.env.NODE_ENV !== 'production';
const S3 = new S3Client({
    apiVersion: '2006-03-01'
});

export class MongoBackup {
    dexChannel: TextChannel

    constructor(channel: TextChannel) {
        this.dexChannel = channel;
    }

    public async backup() {
        let thread;
        let tstamp = moment().format('YYYYMMDD');

        // Base backup directory
        let backupDir = path.resolve('./mongodb-backups');
        let dbBackupDir = `${envParseString('MONGO_DB')}_${tstamp}`;

        const llc = dev ? magentaBright : white;
        const blc = dev ? magenta : blue;

        const line01 = llc('');
        const line02 = llc('');

        // Offset Pad
        const pad = ' '.repeat(7);

        // Create a thread for date of MongoDB backup
        const threadExists = this.dexChannel.threads.cache.find(x => x.name === `Mongo DB Backup - ${moment().format('MM.DD.YYYY')}`);

        if (!threadExists) {
            thread = await this.dexChannel.threads.create({
                name: `Mongo DB Backup - ${moment().format('MM.DD.YYYY')}`,
                autoArchiveDuration: ThreadAutoArchiveDuration.OneWeek,
                reason: `Backup Messages Generated for ${moment().format('MM.DD.YYYY')}`,
                type: ChannelType.PrivateThread
            });
        } else {
            thread = threadExists;
        }

        // Create backup directories if they don't already exist
        if (!fs.existsSync(`${backupDir}/${dbBackupDir}`)) {
            // Check if writing directory for Windows machine or Unix/Linux machine
            if (!(os.platform() === 'win32')) {
                console.log(
                    String.raw`
${line01} ${pad}${blc('Backup directory does not currently exist. Creating backup directory to write to...')}
                    `.trim()
                );

                thread.send('Backup directory does not currently exist. Creating backup directory to write to...');

                let oldmask = process.umask(0);

                try {
                    const firstCreatedDir = mkdirp.sync(`${backupDir}/${dbBackupDir}`, 0o775);

                    process.umask(oldmask);
                    console.log(`Backup directory created: ${firstCreatedDir}`);
                    await thread.send(`Backup directory created: ${firstCreatedDir}`);
                } catch (err) {
                    console.log(
                        String.raw`
${line01} ${pad}${blc('There was a problem creating the backup directory')}
${line02} ${pad}${blc(`Error: ${err.message}`)}
                            `.trim()
                    );
                    await thread.send(`There was a problem creating the backup directory\n${err.message}`);
                }
            } else {
                console.log(
                    String.raw`
${line01} ${pad}${blc('Backup directory does not currently exist. Creating backup directory to write to...')}
                    `.trim()
                );

                thread.send('Backup directory does not currently exist. Creating backup directory to write to...');

                try {
                    const firstCreatedDir = mkdirp.sync(`${backupDir}/${dbBackupDir}`);

                    console.log(`Backup directory created: ${firstCreatedDir}`);
                    await thread.send(`Backup directory created: ${firstCreatedDir}`);
                } catch (err) {
                    console.log(
                        String.raw`
${line01} ${pad}${blc('There was a problem creating the backup directory')}
${line02} ${pad}${blc(`Error: ${err.message}`)}
                            `.trim()
                    )
                    await thread.send(`There was a problem creating the backup directory\n${err.message}`);
                }
            }
        }

        // Run command to do mongo db backup from MongoDB Atlas
        const uri = `mongodb+srv://${envParseString('MONGO_USERNAME')}:${envParseString('MONGO_PASSWORD')}@${envParseString('MONGO_HOST')}/${envParseString('MONGO_DB')}`;
        const mbup = spawn('mongodump', [`--uri=${uri}`, `-o ${backupDir}/${dbBackupDir}`], {
            windowsVerbatimArguments: true
        });

        await thread.send('Running database backup from MongoDB Atlas...');

        mbup.stderr.on('data', async (data) => {
            await console.log(`${data}`);
        });

        mbup.on('close', async (code) => {
            console.log(`Mongodump exited with code ${code}`);
            await thread.send('Database backup completed.');

            // Compress this backup to be uploaded to Amazon S3 bucket
            const compress = spawn('7z', ['a', '-t7z', `${backupDir}/${dbBackupDir}.7z`, `${backupDir}/${dbBackupDir}/*`, '-r', '-bd', '-y', '-sdel']);

            compress.stderr.on('data', (data) => {
                console.error(`stderr: ${data}`)
            });

            compress.on('close', async (code) => {
                console.log(`7zip compression complete with code ${code}`);
                await thread.send(`Database compressed to ${backupDir}/${dbBackupDir}.7z`);

                // Remove the dated backup directory now that it has been placed in a 7z archive
                fs.rmdir(`${backupDir}/${dbBackupDir}`, (err) => {
                    if (!err) {
                        thread.send(`${backupDir}/${dbBackupDir} was removed successfully!`);
                    } else {
                        thread.send(`An error occurred when trying to remove ${backupDir}/${dbBackupDir}`);
                    }
                });

                // Call S3 to retrieve upload file to specified bucket
                const uploadParams: { Bucket: string; Key: string; Body: string | fs.ReadStream; ACL: string } = {
                    Bucket: envParseString('AWS_S3_BUCKET'),
                    Key: '',
                    Body: '',
                    ACL: 'public-read'
                };

                const file = `${backupDir}/${dbBackupDir}.7z`;
                const fileStream = fs.createReadStream(file);

                fileStream.on('error', (err) => {
                    console.error(`File Error: ${err}`);
                    thread.send(`File Error: ${err}`);
                });

                uploadParams.Body = fileStream;
                uploadParams.Key = path.basename(file);

                try {
                    const parallelUploadS3 = new Upload({
                        client: S3,
                        params: uploadParams
                    });

                    parallelUploadS3.on('httpUploadProgress', (progress) => {
                        console.log(progress);
                    });

                    const response = await parallelUploadS3.done();

                    // Location returned in the reponse
                    if ('Location' in response) {
                        console.log(`Upload success - ${response.Location}`);
                        thread.send(`Database backup uploaded to Amazon S3 - ${response.Location}`);
                    } else { // Location does not return in AbortMultipartUploadCommandOutput
                        // Don't know what is retuned in this situation. Just dump the entire response
                        console.error(`Error uploading... ${JSON.stringify(response)}`);
                        await thread.send(`Error uploading... ${JSON.stringify(response)}`);
                    }

                    // Delete the 7z file after upload
                    fs.unlink(`${file}`, async (err) => {
                        if (err) {
                            console.error(`Error deleting file: ${err}`);
                            await thread.send(`Error deleting file: ${err}`);
                        }

                        console.log(`${file} was deleted successfully.`);
                        await thread.send(`${file} was deleted successfully.`);
                    });
                } catch (err) {
                    console.error(`Error uploading to Amazon S3 Bucket: ${JSON.stringify(err)}`)
                }
            });
        });
    }

    public async threadPurge() {
        const threads = this.dexChannel.threads.cache.filter(x => console.log(x));
        console.log(`Threads: ${JSON.stringify(threads)}`);
    }
}
