(location 0 0)

(= drive (\ ((& robot) left right)
  (= (& robot.motors[0].throttle) left)
  (= (& robot.motors[1].throttle) right)))

(= do_nothing (\ ((& self) (& robot) (& ctx))))

(= for_seconds (\ (total)
  (= (phi total) total)
  (obj
    (enter (\ ((& self) (& robot) (& ctx))
      (= (& self.start) (get_time))))
    (update (\ ((& self) (&robot) (& ctx))
      (if (< (+ self.start total) (get_time))
        (= (& ctx.stop) true))))
    (exit do_nothing)
    (start 0))))

(= stop
  (obj
    (enter (\ (& self) (&robot) (& ctx))
      (drive (& robot) 0 0)
      (= (& ctx.stop) true))
    (update do_nothing)
    (exit do_nothing)))

(drive (& robot) 100 100)
(run (& robot) (list (for_seconds 10)))
(drive (& robot) 0 0)
(run (& robot) (list stop))
