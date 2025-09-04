/**
 * Supabase API client for terminal.r3x.sh
 * Connects to shared content database
 */

class SupabaseAPI {
  constructor() {
    // Initialize Supabase client
    const SUPABASE_URL = "https://pzbcvcivvlwbzitjdaie.supabase.co";
    // Replace with your actual anon public key
    const SUPABASE_ANON_KEY =
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB6YmN2Y2l2dmx3YnppdGpkYWllIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcwMjA3MTksImV4cCI6MjA3MjU5NjcxOX0.IbwypFZbgo2ytgZr8KbNFejlnYJuxQG3kCkyltr_EnY";

    this.supabase = window.supabase.createClient(
      SUPABASE_URL,
      SUPABASE_ANON_KEY,
    );
  }

  async getPosts() {
    try {
      const { data, error } = await this.supabase
        .from("posts")
        .select("*")
        .eq("published", true)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Error fetching posts:", error);
      return [];
    }
  }

  async getPost(slug) {
    try {
      const { data, error } = await this.supabase
        .from("posts")
        .select("*")
        .eq("slug", slug)
        .eq("published", true)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error fetching post:", error);
      return null;
    }
  }

  async getPage(slug) {
    try {
      const { data, error } = await this.supabase
        .from("pages")
        .select("*")
        .eq("slug", slug)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error fetching page:", error);
      return null;
    }
  }

  async getAllPages() {
    try {
      const { data, error } = await this.supabase
        .from("pages")
        .select("*")
        .order("title", { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Error fetching pages:", error);
      return [];
    }
  }
}

export { SupabaseAPI };

