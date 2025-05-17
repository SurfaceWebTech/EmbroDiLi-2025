import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { supabase } from './supabaseClient';

let s3Client = null;

export async function initializeS3Client() {
  try {
    const { data, error } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'aws_storage')
      .single();

    if (error) throw error;

    const settings = data.value;

    if (!settings.region || !settings.accessKeyId || !settings.secretAccessKey || !settings.bucketName) {
      throw new Error('Missing AWS configuration');
    }

    s3Client = new S3Client({
      region: settings.region,
      credentials: {
        accessKeyId: settings.accessKeyId,
        secretAccessKey: settings.secretAccessKey
      }
    });

    return true;
  } catch (error) {
    console.error('Error initializing S3 client:', error);
    s3Client = null;
    throw error;
  }
}

async function getDesignPath(designNo) {
  try {
    const { data: designData, error: designError } = await supabase
      .from('documents')
      .select(`
        design_no,
        categories:category_id(code, name),
        subcategories:subcategory_id(name)
      `)
      .eq('design_no', designNo)
      .single();

    if (designError) throw designError;
    if (!designData) throw new Error('Design not found');

    const categoryCode = designNo.substring(0, 2);
    const categoryPath = `${categoryCode} ${designData.categories.name}`;
    const subcategoryPath = designData.subcategories.name;

    return { categoryPath, subcategoryPath };
  } catch (error) {
    console.error('Error getting design path:', error);
    throw new Error(`Failed to get design path: ${error.message}`);
  }
}

async function fetchAndCreateObjectURL(bucketName, region, key) {
  try {
    const url = `https://${bucketName}.s3.${region}.amazonaws.com/${key}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const blob = await response.blob();
    if (blob.size === 0) {
      throw new Error('Received empty file');
    }

    return URL.createObjectURL(blob);
  } catch (error) {
    console.error('Error fetching file:', error);
    throw new Error(`Failed to fetch file: ${error.message}`);
  }
}

export async function getDesignImage(designNo) {
  if (!designNo) {
    throw new Error('Design number is required');
  }

  try {
    if (!s3Client) {
      await initializeS3Client();
    }

    const { data: settingsData } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'aws_storage')
      .single();

    if (!settingsData) {
      throw new Error('AWS storage settings not found');
    }

    const { bucketName, region } = settingsData.value;
    const { categoryPath, subcategoryPath } = await getDesignPath(designNo);

    const key = `${categoryPath}/${subcategoryPath}/${designNo}.PNG`;
    const encodedKey = encodeURIComponent(key).replace(/%20/g, '+');

    return await fetchAndCreateObjectURL(bucketName, region, encodedKey);
  } catch (error) {
    console.error('Error in getDesignImage:', error);
    throw new Error(`Failed to load design image: ${error.message}`);
  }
}

export async function getDesignWorksheet(designNo) {
  if (!designNo) {
    throw new Error('Design number is required');
  }

  try {
    if (!s3Client) {
      await initializeS3Client();
    }

    const { data: settingsData } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'aws_storage')
      .single();

    if (!settingsData) {
      throw new Error('AWS storage settings not found');
    }

    const { bucketName, region } = settingsData.value;
    const { categoryPath, subcategoryPath } = await getDesignPath(designNo);

    // Try both .pdf and .PDF extensions
    const extensions = ['.pdf', '.PDF'];
    let url = null;

    for (const ext of extensions) {
      try {
        const key = `${categoryPath}/${subcategoryPath}/${designNo}${ext}`;
        const encodedKey = encodeURIComponent(key).replace(/%20/g, '+');
        url = await fetchAndCreateObjectURL(bucketName, region, encodedKey);
        if (url) break;
      } catch (error) {
        console.warn(`Failed to fetch worksheet with extension ${ext}:`, error);
      }
    }

    if (!url) {
      throw new Error('Worksheet not found');
    }

    return url;
  } catch (error) {
    console.error('Error in getDesignWorksheet:', error);
    throw new Error(`Failed to load worksheet: ${error.message}`);
  }
}