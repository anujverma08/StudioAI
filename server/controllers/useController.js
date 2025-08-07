
import sql from "../config/db";


export const getUserCreations = async (req, res) => {
    try{
        const userId = req.auth;
        const creations = await sql`Select * FROM creations WHERE user_id = ${userId} ORDER BY created_at DESC`;
        res.status(200).json({
            success: true,
            creations,
        });
    }catch(error){
        console.error("Error fetching user creations:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch user creations.",
        });
    }

};


export const getPublishedCreations = async (req, res) => {
    try{
    
        const creations = await sql`Select * FROM creations WHERE publish = true ORDER BY created_at DESC`;
        res.status(200).json({
            success: true,
            creations,
        });
    }catch(error){
        console.error("Error fetching all published creations:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch all published creations.",
        });
    }

};


export const toggleLikeCreation = async (req, res) => {
    try{
    
        const { userId } = req.auth;
        const { id } = req.body;
        const [creation] = await sql`SELECT * FROM creations WHERE id = ${id}`;

        if (!creation) {
            return res.status(404).json({ success: false, message: "Creation not found." });
        }
        const currentLikes = creation.likes;
        const userIdStr = userId.toString();
        let updatedLikes;
        let message;
        if(currentLikes.includes(userIdStr)){
            updatedLikes = currentLikes.filter((user)=> user !== userIdStr);
            message = "Creation Unliked.";
        }else{
            updatedLikes = [...currentLikes, userIdStr];
            message = "Creation Liked.";
        }

        const formattedArray = `${updatedLikes.json(',')}`;
        await sql`UPDATE creations SET likes = ${formattedArray}::text[] WHERE id = ${id}`;

        res.status(200).json({
            success: true,
            message
        });

    }catch(error){
        console.error("Error fetching all published creations:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch all published creations.",
        });
    }

};