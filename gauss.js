// Input: Array of a linear equation. Last element on each row is the answer
// Ex: mat = [[1, 2, 3, ANSWER1], [4, 5, 6, ANSWER2], [7, 8, 9, ANSWER3]]
export default function gauss(mat)
{
    let columns = mat.length + 1;

    // Generate Upper Triangular Matrix
    for (let i = 0; i < mat.length; i++) 
    {
        for (let j = 0; j < mat.length; j++) 
        {
            if (j > i)
            {
                // Calculate by how much we should multiply row i with to get mat[j][i] = 0 
                let c = mat[j][i] / mat[i][i];

                // Subtract row j with (c * row i)
                for(let k = 0; k < columns; k++)
                {
                    mat[j][k] = mat[j][k] - c * mat[i][k];
                }
            }
        }
    }

    // Solve rest with backward substitution
    let result = new Array(mat.length);
    // Since we now have a Upper triangular matrix, last row is easily solved
    result[result.length-1] = mat[mat.length-1][columns - 1] / mat[mat.length-1][columns - 1];

    // Continue with backward substitution, 
    // aka zero what we can for the rest of the upper triangle with the last row 
    for (let i = result.length-1; i > - 1; i--)
    { 
        result[i] = mat[i][columns - 1] / mat[i][i];
        for (let j=i-1; j > -1; j--) 
        { 
            mat[j][columns - 1] -= mat[j][i] * result[i];
        }
    }

    return {x: result[0], y: result[1], z: result[2]};
}