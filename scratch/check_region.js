const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  "https://xpyjknyogwhyxsmszaxd.supabase.co",
  "sb_publishable_IA3n-Tm5A3m2ZvuquhQrHQ_6A3fT3fI"
);

async function check() {
  const { data, error } = await supabase.from("sprints").select("region").limit(1);
  if (error) {
    console.log("Error querying region:", error.message, error.code);
  } else {
    console.log("Success! Columns list/data:", data);
  }
}

check();
