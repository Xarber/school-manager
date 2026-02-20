import { KEYS } from "./datamanager";
import useAsyncData from "./datamanager";
import { useAllAsyncData } from "./datamanager";
import { UserData, UserInfo } from "./datamanager";
import { HomeworkData, ScheduleHour } from "./datamanager";
import { defaultData } from "./datamanager";

export function useHomeworkPageData() {
    const userData = useAsyncData(KEYS.userData, defaultData.userData);
    const activeClassId = userData.data.settings.activeClassId;
    
    const allClassHomework = useAllAsyncData(
        `${KEYS.homeworkData}:${activeClassId}`, 
        defaultData.homeworkData
    );
    
    return {
        homework: allClassHomework,
        userdata: userData
    };
}

export function useHomescreenPageData() {
    const userData = useAsyncData(KEYS.userData, defaultData.userData);
    const activeClassId = userData.data.settings.activeClassId;
    const classData = useAsyncData(`${KEYS.classData}:${activeClassId}`, defaultData.classData);
    
    const allClassHomework = useAllAsyncData(
        `${KEYS.homeworkData}:${activeClassId}`, 
        defaultData.homeworkData
    );
    const allClassLessons = useAllAsyncData(
        `${KEYS.lessonData}:${activeClassId}`, 
        defaultData.lessonData
    );
    const allClassSubjects = useAllAsyncData(
        `${KEYS.subjectData}:${activeClassId}`, 
        defaultData.subjectData
    )
    const exams = Object.values(allClassLessons.data).filter((lesson)=>{
        const date = new Date(lesson.date + ' ' + lesson.time);
        const now = new Date();
        return (date > now) && (lesson.isExam);
    });
    const tomorrowDay = new Date(new Date().getTime() + 86400000).toLocaleDateString("en-GB", {
        weekday: "long",
    });

    const tomorrow = classData.data.schedule[tomorrowDay];
    
    return {
        homework: allClassHomework,
        grades: userData.data.grades,
        subjects: allClassSubjects,
        tomorrowSchedule: tomorrow,
        exams: exams,
        userdata: userData
    };
}

export function useCalendarPageData() {
    const userData = useAsyncData(KEYS.userData, defaultData.userData);
    const activeClassId = userData.data.settings.activeClassId;
    const classData = useAsyncData(`${KEYS.classData}:${activeClassId}`, defaultData.classData);
    
    const allClassHomework = useAllAsyncData(
        `${KEYS.homeworkData}:${activeClassId}`, 
        defaultData.homeworkData
    );
    const allClassLessons = useAllAsyncData(
        `${KEYS.lessonData}:${activeClassId}`, 
        defaultData.lessonData
    );
    const exams = Object.values(allClassLessons.data).filter((lesson)=>{
        return (lesson.isExam);
    });
    
    return {
        homework: allClassHomework,
        lessons: allClassLessons,
        exams: exams,
        userdata: userData
    };
}

export function useRegistryPageData() {
    const userData = useAsyncData(KEYS.userData, defaultData.userData);

    return {
        grades: userData.data.grades,
    }
}