export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      achievements: {
        Row: {
          category: string | null
          created_at: string | null
          description: string | null
          id: string
          title: string
          updated_at: string | null
          user_id: string
          year: number | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          title: string
          updated_at?: string | null
          user_id: string
          year?: number | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          title?: string
          updated_at?: string | null
          user_id?: string
          year?: number | null
        }
        Relationships: []
      }
      albums: {
        Row: {
          cover_image_url: string | null
          created_at: string | null
          description: string | null
          id: string
          title: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          cover_image_url?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          title: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          cover_image_url?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          title?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "albums_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      analytics: {
        Row: {
          created_at: string
          data: Json | null
          event_type: string
          id: string
          track_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          data?: Json | null
          event_type: string
          id?: string
          track_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          data?: Json | null
          event_type?: string
          id?: string
          track_id?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      analytics_events: {
        Row: {
          created_at: string
          event_category: string
          event_name: string
          event_value: number | null
          id: string
          ip_address: string | null
          metadata: Json | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          event_category: string
          event_name: string
          event_value?: number | null
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          event_category?: string
          event_name?: string
          event_value?: number | null
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      audio_tracks: {
        Row: {
          allow_download: boolean | null
          artist: string | null
          audio_url: string
          duration: number | null
          duration_seconds: number | null
          id: string
          price: number | null
          project_id: string
          title: string
          uploaded_at: string | null
          user_id: string
        }
        Insert: {
          allow_download?: boolean | null
          artist?: string | null
          audio_url: string
          duration?: number | null
          duration_seconds?: number | null
          id?: string
          price?: number | null
          project_id: string
          title: string
          uploaded_at?: string | null
          user_id: string
        }
        Update: {
          allow_download?: boolean | null
          artist?: string | null
          audio_url?: string
          duration?: number | null
          duration_seconds?: number | null
          id?: string
          price?: number | null
          project_id?: string
          title?: string
          uploaded_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "audio_tracks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      badges: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          image_url: string | null
          name: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          name: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          name?: string
        }
        Relationships: []
      }
      bookmarks: {
        Row: {
          created_at: string | null
          id: string
          project_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          project_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          project_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookmarks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      cart_items: {
        Row: {
          cart_id: string | null
          created_at: string
          id: string
          is_saved_for_later: boolean
          playlist_id: string | null
          project_id: string | null
          quantity: number
          selected_file_types: string[] | null
          service_id: string | null
          track_id: string | null
          updated_at: string
        }
        Insert: {
          cart_id?: string | null
          created_at?: string
          id?: string
          is_saved_for_later?: boolean
          playlist_id?: string | null
          project_id?: string | null
          quantity?: number
          selected_file_types?: string[] | null
          service_id?: string | null
          track_id?: string | null
          updated_at?: string
        }
        Update: {
          cart_id?: string | null
          created_at?: string
          id?: string
          is_saved_for_later?: boolean
          playlist_id?: string | null
          project_id?: string | null
          quantity?: number
          selected_file_types?: string[] | null
          service_id?: string | null
          track_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cart_items_cart_id_fkey"
            columns: ["cart_id"]
            isOneToOne: false
            referencedRelation: "carts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cart_items_playlist_id_fkey"
            columns: ["playlist_id"]
            isOneToOne: false
            referencedRelation: "playlists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cart_items_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cart_items_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cart_items_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "audio_tracks"
            referencedColumns: ["id"]
          },
        ]
      }
      carts: {
        Row: {
          created_at: string
          id: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      contracts: {
        Row: {
          created_at: string
          distribution_notes: string | null
          distribution_platforms: string | null
          distribution_territories: string | null
          expires_at: string | null
          id: string
          pro_affiliation: string | null
          publisher_name: string | null
          publishing_notes: string | null
          revenue_split: number | null
          royalty_split: number | null
          split_notes: string | null
          status: Database["public"]["Enums"]["contract_status"]
          terms_conditions: string | null
          title: string
          type: Database["public"]["Enums"]["contract_type"]
          user_id: string
        }
        Insert: {
          created_at?: string
          distribution_notes?: string | null
          distribution_platforms?: string | null
          distribution_territories?: string | null
          expires_at?: string | null
          id?: string
          pro_affiliation?: string | null
          publisher_name?: string | null
          publishing_notes?: string | null
          revenue_split?: number | null
          royalty_split?: number | null
          split_notes?: string | null
          status?: Database["public"]["Enums"]["contract_status"]
          terms_conditions?: string | null
          title: string
          type: Database["public"]["Enums"]["contract_type"]
          user_id: string
        }
        Update: {
          created_at?: string
          distribution_notes?: string | null
          distribution_platforms?: string | null
          distribution_territories?: string | null
          expires_at?: string | null
          id?: string
          pro_affiliation?: string | null
          publisher_name?: string | null
          publishing_notes?: string | null
          revenue_split?: number | null
          royalty_split?: number | null
          split_notes?: string | null
          status?: Database["public"]["Enums"]["contract_status"]
          terms_conditions?: string | null
          title?: string
          type?: Database["public"]["Enums"]["contract_type"]
          user_id?: string
        }
        Relationships: []
      }
      conversation_participants: {
        Row: {
          conversation_id: string
          created_at: string | null
          id: string
          is_pinned: boolean | null
          joined_at: string | null
          last_read_at: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          conversation_id: string
          created_at?: string | null
          id?: string
          is_pinned?: boolean | null
          joined_at?: string | null
          last_read_at?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          conversation_id?: string
          created_at?: string | null
          id?: string
          is_pinned?: boolean | null
          joined_at?: string | null
          last_read_at?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_participants_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_user_id"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          created_at: string | null
          id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      dashboard_metrics: {
        Row: {
          end_date: string | null
          id: string
          metric_name: string
          metric_value: number
          start_date: string | null
          time_period: string
          updated_at: string
          user_id: string
        }
        Insert: {
          end_date?: string | null
          id?: string
          metric_name: string
          metric_value: number
          start_date?: string | null
          time_period: string
          updated_at?: string
          user_id: string
        }
        Update: {
          end_date?: string | null
          id?: string
          metric_name?: string
          metric_value?: number
          start_date?: string | null
          time_period?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      dispute_evidence: {
        Row: {
          description: string | null
          dispute_id: string
          file_name: string
          file_size: number | null
          file_type: string
          file_url: string
          id: string
          uploaded_at: string
          user_id: string
        }
        Insert: {
          description?: string | null
          dispute_id: string
          file_name: string
          file_size?: number | null
          file_type: string
          file_url: string
          id?: string
          uploaded_at?: string
          user_id: string
        }
        Update: {
          description?: string | null
          dispute_id?: string
          file_name?: string
          file_size?: number | null
          file_type?: string
          file_url?: string
          id?: string
          uploaded_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "dispute_evidence_dispute_id_fkey"
            columns: ["dispute_id"]
            isOneToOne: false
            referencedRelation: "disputes"
            referencedColumns: ["id"]
          },
        ]
      }
      dispute_messages: {
        Row: {
          created_at: string | null
          dispute_id: string
          id: string
          is_admin: boolean
          message: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          dispute_id: string
          id?: string
          is_admin?: boolean
          message: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          dispute_id?: string
          id?: string
          is_admin?: boolean
          message?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "dispute_messages_dispute_id_fkey"
            columns: ["dispute_id"]
            isOneToOne: false
            referencedRelation: "disputes"
            referencedColumns: ["id"]
          },
        ]
      }
      disputes: {
        Row: {
          amount_disputed: number
          created_at: string | null
          description: string
          dispute_type: string
          id: string
          priority: string
          resolution: string | null
          resolved_at: string | null
          status: string
          title: string
          transaction_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          amount_disputed: number
          created_at?: string | null
          description: string
          dispute_type: string
          id?: string
          priority?: string
          resolution?: string | null
          resolved_at?: string | null
          status?: string
          title: string
          transaction_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          amount_disputed?: number
          created_at?: string | null
          description?: string
          dispute_type?: string
          id?: string
          priority?: string
          resolution?: string | null
          resolved_at?: string | null
          status?: string
          title?: string
          transaction_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      files: {
        Row: {
          album: string | null
          allow_download: boolean | null
          artist: string | null
          bpm: number | null
          created_at: string | null
          description: string | null
          duration_seconds: number | null
          file_path: string
          file_type: string
          file_url: string
          folder_id: string | null
          genre: string | null
          id: string
          key: string | null
          mood: string | null
          name: string
          size: number
          starred: boolean | null
          tags: string[] | null
          updated_at: string | null
          user_id: string
          year: number | null
        }
        Insert: {
          album?: string | null
          allow_download?: boolean | null
          artist?: string | null
          bpm?: number | null
          created_at?: string | null
          description?: string | null
          duration_seconds?: number | null
          file_path: string
          file_type: string
          file_url: string
          folder_id?: string | null
          genre?: string | null
          id: string
          key?: string | null
          mood?: string | null
          name: string
          size: number
          starred?: boolean | null
          tags?: string[] | null
          updated_at?: string | null
          user_id: string
          year?: number | null
        }
        Update: {
          album?: string | null
          allow_download?: boolean | null
          artist?: string | null
          bpm?: number | null
          created_at?: string | null
          description?: string | null
          duration_seconds?: number | null
          file_path?: string
          file_type?: string
          file_url?: string
          folder_id?: string | null
          genre?: string | null
          id?: string
          key?: string | null
          mood?: string | null
          name?: string
          size?: number
          starred?: boolean | null
          tags?: string[] | null
          updated_at?: string | null
          user_id?: string
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "files_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "folders"
            referencedColumns: ["id"]
          },
        ]
      }
      folders: {
        Row: {
          created_at: string | null
          id: string
          name: string
          parent_id: string | null
          starred: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          parent_id?: string | null
          starred?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          parent_id?: string | null
          starred?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "folders_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "folders"
            referencedColumns: ["id"]
          },
        ]
      }
      followers: {
        Row: {
          created_at: string | null
          followed_id: string
          follower_id: string
        }
        Insert: {
          created_at?: string | null
          followed_id: string
          follower_id: string
        }
        Update: {
          created_at?: string | null
          followed_id?: string
          follower_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "followers_followed_id_fkey"
            columns: ["followed_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "followers_follower_id_fkey"
            columns: ["follower_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      gems_transactions: {
        Row: {
          amount: number
          created_at: string | null
          description: string | null
          id: string
          transaction_type: string
          user_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          description?: string | null
          id?: string
          transaction_type: string
          user_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          description?: string | null
          id?: string
          transaction_type?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gems_transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      given_gems: {
        Row: {
          amount: number
          created_at: string | null
          given_at: string | null
          giver_id: string | null
          id: string
          receiver_id: string | null
          revoked_at: string | null
          status: string
          track_id: string | null
          updated_at: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          given_at?: string | null
          giver_id?: string | null
          id?: string
          receiver_id?: string | null
          revoked_at?: string | null
          status?: string
          track_id?: string | null
          updated_at?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          given_at?: string | null
          giver_id?: string | null
          id?: string
          receiver_id?: string | null
          revoked_at?: string | null
          status?: string
          track_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "given_gems_giver_id_fkey"
            columns: ["giver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "given_gems_receiver_id_fkey"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "given_gems_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "audio_tracks"
            referencedColumns: ["id"]
          },
        ]
      }
      history: {
        Row: {
          duration_played: number
          id: string
          played_at: string
          track_id: string | null
          user_id: string | null
        }
        Insert: {
          duration_played: number
          id?: string
          played_at?: string
          track_id?: string | null
          user_id?: string | null
        }
        Update: {
          duration_played?: number
          id?: string
          played_at?: string
          track_id?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      likes: {
        Row: {
          liked_at: string
          track_id: string
          user_id: string
        }
        Insert: {
          liked_at?: string
          track_id: string
          user_id: string
        }
        Update: {
          liked_at?: string
          track_id?: string
          user_id?: string
        }
        Relationships: []
      }
      listening_sessions: {
        Row: {
          created_at: string
          id: number
          last_active_at: string
          track_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: number
          last_active_at?: string
          track_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: number
          last_active_at?: string
          track_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "listening_sessions_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "audio_tracks"
            referencedColumns: ["id"]
          },
        ]
      }
      message_attachments: {
        Row: {
          created_at: string | null
          file_name: string
          file_size: number | null
          file_type: string
          file_url: string
          id: string
          message_id: string | null
        }
        Insert: {
          created_at?: string | null
          file_name: string
          file_size?: number | null
          file_type: string
          file_url: string
          id?: string
          message_id?: string | null
        }
        Update: {
          created_at?: string | null
          file_name?: string
          file_size?: number | null
          file_type?: string
          file_url?: string
          id?: string
          message_id?: string | null
        }
        Relationships: []
      }
      messages: {
        Row: {
          content: string | null
          conversation_id: string
          created_at: string | null
          id: string
          is_read: boolean | null
          metadata: Json | null
          sender_id: string
          updated_at: string | null
        }
        Insert: {
          content?: string | null
          conversation_id: string
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          metadata?: Json | null
          sender_id: string
          updated_at?: string | null
        }
        Update: {
          content?: string | null
          conversation_id?: string
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          metadata?: Json | null
          sender_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_conversation_id"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_sender_id"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      note_files: {
        Row: {
          created_at: string | null
          file_id: string
          id: string
          note_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          file_id: string
          id?: string
          note_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          file_id?: string
          id?: string
          note_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_note_files_file_id"
            columns: ["file_id"]
            isOneToOne: false
            referencedRelation: "files"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_note_files_note_id"
            columns: ["note_id"]
            isOneToOne: false
            referencedRelation: "notes"
            referencedColumns: ["id"]
          },
        ]
      }
      notes: {
        Row: {
          content: string | null
          created_at: string | null
          id: string
          project_id: string | null
          title: string
          track_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          id?: string
          project_id?: string | null
          title: string
          track_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          content?: string | null
          created_at?: string | null
          id?: string
          project_id?: string | null
          title?: string
          track_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notes_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notes_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "audio_tracks"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          created_at: string | null
          customer_email: string | null
          customer_name: string | null
          customer_phone: string | null
          id: string
          items: Json | null
          order_date: string | null
          payment_method: string | null
          processing_fee: number | null
          shipping_address: string | null
          status: string | null
          subtotal: number | null
          tax: number | null
          title: string
          total: number
          type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          id?: string
          items?: Json | null
          order_date?: string | null
          payment_method?: string | null
          processing_fee?: number | null
          shipping_address?: string | null
          status?: string | null
          subtotal?: number | null
          tax?: number | null
          title: string
          total: number
          type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          id?: string
          items?: Json | null
          order_date?: string | null
          payment_method?: string | null
          processing_fee?: number | null
          shipping_address?: string | null
          status?: string | null
          subtotal?: number | null
          tax?: number | null
          title?: string
          total?: number
          type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      playlists: {
        Row: {
          cover_image_url: string | null
          created_at: string | null
          description: string | null
          id: string
          is_public: boolean
          price: number | null
          title: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          cover_image_url?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_public?: boolean
          price?: number | null
          title: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          cover_image_url?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_public?: boolean
          price?: number | null
          title?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "playlists_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          email: string | null
          full_name: string | null
          genres: string[] | null
          id: string
          instruments: string[] | null
          is_onboarded: boolean
          professional_title: string | null
          updated_at: string | null
          username: string | null
          website_url: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          genres?: string[] | null
          id: string
          instruments?: string[] | null
          is_onboarded?: boolean
          professional_title?: string | null
          updated_at?: string | null
          username?: string | null
          website_url?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          genres?: string[] | null
          id?: string
          instruments?: string[] | null
          is_onboarded?: boolean
          professional_title?: string | null
          updated_at?: string | null
          username?: string | null
          website_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      project_contracts: {
        Row: {
          contract_id: string
          created_at: string | null
          id: string
          project_id: string
          user_id: string
        }
        Insert: {
          contract_id: string
          created_at?: string | null
          id?: string
          project_id: string
          user_id: string
        }
        Update: {
          contract_id?: string
          created_at?: string | null
          id?: string
          project_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_contracts_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_contracts_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_files: {
        Row: {
          created_at: string | null
          file_path: string
          file_type: string
          file_url: string
          id: string
          project_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          file_path: string
          file_type: string
          file_url: string
          id?: string
          project_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          file_path?: string
          file_type?: string
          file_url?: string
          id?: string
          project_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_files_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          bpm: number | null
          cover_image_url: string | null
          created_at: string | null
          description: string | null
          genre: string | null
          id: string
          is_public: boolean
          key: string | null
          linked_project_id: string | null
          mood: string | null
          price: number | null
          sub_genre: string | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          bpm?: number | null
          cover_image_url?: string | null
          created_at?: string | null
          description?: string | null
          genre?: string | null
          id?: string
          is_public?: boolean
          key?: string | null
          linked_project_id?: string | null
          mood?: string | null
          price?: number | null
          sub_genre?: string | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          bpm?: number | null
          cover_image_url?: string | null
          created_at?: string | null
          description?: string | null
          genre?: string | null
          id?: string
          is_public?: boolean
          key?: string | null
          linked_project_id?: string | null
          mood?: string | null
          price?: number | null
          sub_genre?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_linked_project_id_fkey"
            columns: ["linked_project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          name: string
          price: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          name: string
          price: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          name?: string
          price?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "services_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      track_streams: {
        Row: {
          created_at: string | null
          id: string
          stream_count: number
          track_id: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          stream_count?: number
          track_id: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          stream_count?: number
          track_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "track_streams_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "audio_tracks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "track_streams_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      track_variants: {
        Row: {
          created_at: string
          file_path: string
          file_type: string
          file_url: string
          id: string
          track_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          file_path: string
          file_type: string
          file_url: string
          id?: string
          track_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          file_path?: string
          file_type?: string
          file_url?: string
          id?: string
          track_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "track_variants_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "audio_tracks"
            referencedColumns: ["id"]
          },
        ]
      }
      user_badges: {
        Row: {
          badge_id: string
          created_at: string | null
          id: string
          user_id: string
        }
        Insert: {
          badge_id: string
          created_at?: string | null
          id?: string
          user_id: string
        }
        Update: {
          badge_id?: string
          created_at?: string | null
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_badges_badge_id_fkey"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "badges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_badges_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_wallets: {
        Row: {
          balance: number
          created_at: string | null
          id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          balance?: number
          created_at?: string | null
          id?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          balance?: number
          created_at?: string | null
          id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_wallets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_daily_gems_eligibility: {
        Args: {
          p_user_id: string
        }
        Returns: boolean
      }
      claim_daily_gems: {
        Args: {
          p_user_id: string
        }
        Returns: undefined
      }
      create_conversation_with_participants: {
        Args: {
          participant_ids: string[]
        }
        Returns: string
      }
      delete_user_account: {
        Args: {
          user_id_input: string
        }
        Returns: undefined
      }
      get_full_project_id: {
        Args: {
          short_id: string
        }
        Returns: string
      }
      get_profile_with_stats: {
        Args: {
          p_profile_id: string
        }
        Returns: Json
      }
      get_user_total_streams: {
        Args: {
          p_user_id: string
        }
        Returns: number
      }
      search_projects: {
        Args: {
          search_term: string
        }
        Returns: Json
      }
    }
    Enums: {
      contract_status: "pending" | "active" | "inactive" | "expired" | "terminated"
      contract_type: "exclusive" | "non_exclusive" | "work_for_hire"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (Database["public"]["Tables"] & Database["public"]["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (Database["public"]["Tables"] &
        Database["public"]["Views"])
    ? (Database["public"]["Tables"] &
        Database["public"]["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
      : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof Database["public"]["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
    ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
      : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof Database["public"]["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
    ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
      : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof Database["public"]["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof Database["public"]["Enums"]
    ? Database["public"]["Enums"][PublicEnumNameOrOptions]
    : never
