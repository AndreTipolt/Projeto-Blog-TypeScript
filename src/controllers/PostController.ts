import { Request, Response } from "express";
import { postRepository } from "../repositories/PostRepository";
import { date, z } from 'zod'

export class PostController {
    static async getCreate(req: Request, res: Response) {
        return res.render('createPost')
    }
    static async home(req: Request, res: Response) {

        const currentDate = new Date()
        const posts = (await postRepository.find({ relations: { user: true } }))
            .map((post) => {

                post.user.password = ''

                const diff = currentDate.getTime() - post.date.getTime()
                const baseDiffHour = diff / 1000 / 60 / 60 

                let diffDates;

                if(baseDiffHour < 1){ // Minutes

                    const minutes = baseDiffHour * 60

                    if(minutes < 1){

                        diffDates = 'Agora Mesmo'

                    } else{

                        diffDates = `há ${minutes.toFixed(0)} Minutos`
                    }

                }else if(baseDiffHour > 24){ // Days

                    const days = baseDiffHour / 24

                    if(days >= 7){ // Weeks

                        const weeks = days / 7
                        diffDates = `há ${weeks.toFixed(0)} Semanas`

                    } else{

                        diffDates = `há ${days.toFixed(0)} Dias`
                    }

                }
                else{ // Hours
                    diffDates = `há ${baseDiffHour.toFixed(0)} Horas`
                }
                
                return { post, diffDates }
            })

        return res.status(200).render('home', { posts })
    }

    static async create(req: Request, res: Response) {

        const postShema = z.object({
            title: z.string().min(2, 'Errou'),
            content: z.string()
        })

        type Post = z.infer<typeof postShema>

        try {

            const { title, content } = postShema.parse(req.body)

            if (!title || !content) {

                return res.status(400).json('Fill all Fields')

            }
            const datePost = new Date()

            const newPost = await postRepository.create({ title, content, date: datePost, user: req.user })

            await postRepository.save(newPost)

            return res.status(201).redirect('/post/')
        } catch (error) {
            return res.status(400).render('createPost', { msg: 'Dados Inválidos' })
        }

    }
}