import supabase, { supabaseUrl } from "./supabase";

export async function getCabins() {
  const { data, error } = await supabase.from("cabins").select("*");

  if (error) {
    console.log(error.message);
    throw new Error("Cabins not loaded");
  }
  return data;
}

export async function createEditCabin(newCabin, id) {
  const hasImagePath = newCabin.image?.startsWith?.(supabaseUrl);

  const imageName = `${Math.random()}-${newCabin.image.name}`
    .replace(/\s+/g, "-") // Replace spaces with dashes
    .replace(/[^a-zA-Z0-9.-]/g, "") // Remove special characters
    .toLowerCase(); // Convert to lowercase
  const imagePath = hasImagePath
    ? newCabin.image
    : `${supabaseUrl}/storage/v1/object/public/cabin-images/${imageName}`;

  //1. CREATE CABIN IF WE DONT HAVE AN ID ALREADY
  let query = supabase.from("cabins");

  //Α) CREATE/ EDIT CABIN
  if (!id) query = query.insert([{ ...newCabin, image: imagePath }]);

  //Β) EDIT CABIN
  if (id)
    query = query
      .update({ ...newCabin, image: imagePath })
      .eq("id", id)
      .select();
  const { data, error } = await query.select().single();

  if (error) {
    console.log(error.message);
    throw new Error("Cabin could not be Created");
  }

  //2. UPLOAD IMAGE
  if (hasImagePath) return data;

  const { error: storageError } = await supabase.storage
    .from("cabin-images")
    .upload(imageName, newCabin.image);

  //3. DELETE CABIN IF THERE WAS ERROR UPLOADING IMAGE
  if (storageError) {
    await supabase.from("cabins").delete().eq("id", data.id);
    console.log(storageError);
    throw new Error("Cabin iimage could not be uploaded . Cabin not created");
  }

  return data;
}

export async function deleteCabin(id) {
  const { data, error } = await supabase.from("cabins").delete().eq("id", id);

  if (error) {
    console.log(error.message);
    throw new Error("Cabin could not be deleted");
  }
  return data;
}
