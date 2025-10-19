import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import JSZip from 'https://esm.sh/jszip@3.10.1'

serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  }

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    const { fileIds, orderId, itemTitle } = await req.json()

    if (!fileIds || !Array.isArray(fileIds) || fileIds.length === 0) {
      throw new Error('fileIds array is required')
    }

    // Fetch all files
    const { data: files, error: filesError } = await supabaseClient
      .from('files')
      .select('id, name, file_url')
      .in('id', fileIds)

    if (filesError) throw filesError

    if (!files || files.length === 0) {
      throw new Error('No files found')
    }

    // Create ZIP file
    const zip = new JSZip()

    // Download each file and add to ZIP
    for (const file of files) {
      try {
        const response = await fetch(file.file_url)
        if (!response.ok) {
          console.warn(`Failed to download file ${file.name}: ${response.status}`)
          continue
        }

        const fileData = await response.arrayBuffer()
        zip.file(file.name, fileData)
      } catch (error) {
        console.warn(`Error downloading file ${file.name}:`, error)
        continue
      }
    }

    // Generate ZIP file
    const zipBlob = await zip.generateAsync({ type: 'blob' })

    // Upload ZIP to storage
    const zipFileName = `stem-files-${orderId}-${itemTitle.replace(/[^a-zA-Z0-9]/g, '-')}.zip`
    const { data: uploadData, error: uploadError } = await supabaseClient.storage
      .from('order-files')
      .upload(zipFileName, zipBlob, {
        contentType: 'application/zip',
        upsert: false
      })

    if (uploadError) throw uploadError

    // Get public URL
    const { data: { publicUrl } } = supabaseClient.storage
      .from('order-files')
      .getPublicUrl(zipFileName)

    return new Response(
      JSON.stringify({
        success: true,
        zipUrl: publicUrl,
        fileName: zipFileName,
        fileCount: files.length
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('Error creating STEM ZIP:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})